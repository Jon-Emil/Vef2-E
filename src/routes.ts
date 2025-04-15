import { Hono, type Context, type Next } from "hono";
import { serve } from "@hono/node-server";
import { readFile } from "fs/promises";
import ejs from "ejs";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import { makeHTML } from "./lib/rendering.js";
import {
  checkPassword,
  generateToken,
  getUserFromToken,
  hashPassword,
} from "./lib/authentication.js";
import { getCurrentDate, getMaxDays } from "./lib/dateHelper.js";
import { createData, findData, findEarliest, getMonthsData, replaceData } from "./lib/database/data.db.js";
import {
  userValidator,
  type DataInfo,
  type RenderingData,
} from "./lib/validation.js";
import { createUser, findUserWithName } from "./lib/database/users.db.js";
import { setCookie } from "hono/cookie";

const app = new Hono();

async function userChecker(c: Context, next: Next) {
  const user = await getUserFromToken(c);
  if (!user) {
    console.log("no user found");
    return c.html(await makeHTML("login.ejs", {}));
  }
  await next();
}

app.get("/", userChecker, async (c) => {
  const user = await getUserFromToken(c);

  if (!user) {
    return c.html(await makeHTML("error.ejs", {}));
  }

  const { currYear, currMonth } = getCurrentDate();
  const oldInfo = await findEarliest(user);

  let oldestYear;
  let oldestMonth;

  if (!oldInfo) {
    oldestYear = currYear;
    oldestMonth = currMonth;
  } else {
    oldestYear = oldInfo.oldYear;
    oldestMonth = oldInfo.oldMonth;
  }

  const maxDays = getMaxDays(currYear, currMonth);
  const monthData = await getMonthsData(user, currYear, currMonth);

  console.log("month data:", monthData);

  const renderingData: RenderingData = {
    maxYear: currYear,
    maxMonth: currMonth,
    lowestYear: oldestYear,
    lowestMonth: oldestMonth,
    selectedYear: currYear,
    selectedMonth: currMonth,
    monthDays: maxDays,
    monthData: monthData,
  };

  return c.html(await makeHTML("layout.ejs", renderingData));
});

app.get("/login", async (c) => {
  return c.html(await makeHTML("login.ejs", {}));
});

app.get("/register", async (c) => {
  return c.html(await makeHTML("register.ejs", {}));
});

app.get("/:year/:month", userChecker, async (c) => {
  const user = await getUserFromToken(c);

  if (!user) {
    return c.html(await makeHTML("error.ejs", {}));
  }

  const { currYear, currMonth } = getCurrentDate();

  let selectedYear = Number(c.req.param("year"));
  let selectedMonth = Number(c.req.param("month"));

  const oldInfo = await findEarliest(user);

  let oldestYear;
  let oldestMonth;

  if (!oldInfo) {
    oldestYear = selectedYear;
    oldestMonth = selectedMonth;
  } else {
    oldestYear = oldInfo.oldYear;
    oldestMonth = oldInfo.oldMonth;
  }

  if (isNaN(selectedYear) || isNaN(selectedMonth)) {
    selectedYear = currYear;
    selectedMonth = currMonth;
  }

  const selectedDate = new Date(selectedYear, selectedMonth - 1);
  const minDate = new Date(oldestYear, oldestMonth - 1);
  const maxDate = new Date(currYear, currMonth - 1);

  if (selectedDate < minDate) {
    selectedYear = oldestYear;
    selectedMonth = oldestMonth;
  } else if (selectedDate > maxDate) {
    selectedYear = currYear;
    selectedMonth = currMonth;
  }

  const maxDays = getMaxDays(selectedYear, selectedMonth);
  const monthData = await getMonthsData(user, selectedYear, selectedMonth);

  const renderingData: RenderingData = {
    maxYear: currYear,
    maxMonth: currMonth,
    lowestYear: oldestYear,
    lowestMonth: oldestMonth,
    selectedYear: selectedYear,
    selectedMonth: selectedMonth,
    monthDays: maxDays,
    monthData: monthData,
  };
  return c.html(await makeHTML("layout.ejs", renderingData));
});

app.post("/login", async (c) => {
  const userInfo = await c.req.parseBody();
  console.log(userInfo);

  const validatedUser = userValidator(userInfo);

  if (!validatedUser.success) {
    return c.html(await makeHTML("error.ejs", {}));
  }

  const givenData = validatedUser.data;
  const user = await findUserWithName(givenData.username);

  if (!user || !checkPassword(givenData.password, user.password)) {
    return c.html("error.ejs", {});
  }

  const token = generateToken(user);
  setCookie(c, "auth", token, { httpOnly: true, secure: true, path: "/" });

  return c.redirect("/");
});

app.post("/register", async (c) => {
  const userInfo = await c.req.parseBody();
  console.log(userInfo);

  const validatedUser = userValidator(userInfo);

  if (!validatedUser.success) {
    return c.html(await makeHTML("error.ejs", {}));
  }

  const givenData = validatedUser.data;
  const user = await findUserWithName(givenData.username);

  if (user) {
    return c.html("error.ejs", {});
  }

  givenData.password = await hashPassword(givenData.password);

  const newUser = await createUser(givenData);

  const token = generateToken(newUser);
  setCookie(c, "auth", token, { httpOnly: true, secure: true, path: "/" });

  return c.redirect("/");
});

app.post("/submit", userChecker, async (c) => {
  const user = await getUserFromToken(c);

  if (!user) {
    return c.html("error.ejs", {});
  }

  const data = await c.req.parseBody();

  if (!data) {
    return c.html("error.ejs", {});
  }

  const givenNumber = Number(data.number);

  if (isNaN(givenNumber)) {
    return c.html("error.ejs", {});
  }

  const {currYear, currMonth, currDay} = getCurrentDate();

  const newData = {
    year: currYear,
    month: currMonth,
    day: currDay,
    userID: user.id,
    value: givenNumber,
  }

  const foundData = await findData(user, currYear, currMonth, currDay);

  if (!foundData) {
    createData(newData);
  } else {
    replaceData(newData);
  }

  return c.redirect("/");
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
