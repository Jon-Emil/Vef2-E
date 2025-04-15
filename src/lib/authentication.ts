import passport from "passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { Context, Next } from "hono";
import { findUserWithID } from "./database/users.db.js";
import type { User } from "./validation.js";
import { getCookie } from "hono/cookie";

const { JWT_SECRET: jwtSecret, TOKEN_LIFETIME: tokenLifetime = "3600" } =
  process.env;

if (!jwtSecret) {
  console.error("Vantar .env gildi");
  process.exit(1);
}

const { BCRYPT_ROUNDS: bcryptRounds = "1" } = process.env;

export const tokenOptions = { expiresIn: parseInt(tokenLifetime, 10) };

export const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
};

passport.use(
  new Strategy(jwtOptions, async (jwtPayload, done) => {
    const user = await findUserWithID(jwtPayload.id);
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  })
);

export function generateToken(user: User) {
  if (!jwtSecret) {
    console.error("Missing jwtSecret");
    throw new Error();
  }
  return jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "1h" });
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, parseInt(bcryptRounds, 10));
}

export async function checkPassword(
  givenPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(givenPassword, hashedPassword);
}

export async function getUserFromToken(c: Context): Promise<User | null> {
  const token = getCookie(c, "auth");

  if (!token) {
    return null;
  }

  if (!jwtSecret) {
    console.error("Missing jwtSecret");
    return null;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: number };
    const user = await findUserWithID(decoded.id);

    return user ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
}
