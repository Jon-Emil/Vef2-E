import { PrismaClient } from "@prisma/client";
import type { Data, DataInfo, User } from "../validation.js";

const prisma = new PrismaClient();

export async function getMonthsData(
  user: User,
  year: number,
  month: number
): Promise<Array<Data>> {
  const monthsData = await prisma.data.findMany({
    where: {
      userID: user.id,
      year: year,
      month: month,
    },
  });
  return monthsData;
}

export async function createData(dataInfo: DataInfo): Promise<Data | null> {
  const createdData = await prisma.data.create({
    data: {
      year: dataInfo.year,
      month: dataInfo.month,
      day: dataInfo.day,
      value: dataInfo.value,
      userID: dataInfo.userID,
    },
  });

  return createdData;
}

export async function findEarliest(
  user: User
): Promise<{ oldYear: number; oldMonth: number } | null> {
  const earliestData = await prisma.data.findFirst({
    where: {
      userID: user.id,
    },
    orderBy: [{ year: "asc" }, { month: "asc" }, { day: "asc" }],
  });
  if (!earliestData) {
    return null;
  }
  return { oldYear: earliestData.year, oldMonth: earliestData.month };
}

export async function findData(
  user: User,
  year: number,
  month: number,
  day: number,
): Promise<Data | null> {
  const monthsData = await prisma.data.findUnique({
    where: {
      year_month_day_userID: {
        year,
        month,
        day,
        userID: user.id,
      },
    },
  });
  return monthsData;
}

export async function replaceData(dataInfo: DataInfo): Promise<Data> {
  const updatedData = await prisma.data.update({
    where: {
      year_month_day_userID: {
        year: dataInfo.year,
        month: dataInfo.month,
        day: dataInfo.day,
        userID: dataInfo.userID,
      },
    },
    data: {
      value: dataInfo.value,
    },
  });

  return updatedData;
}
