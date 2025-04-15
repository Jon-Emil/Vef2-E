import { PrismaClient } from "@prisma/client";
import type { User, UserInfo } from "../validation.js";

const prisma = new PrismaClient();

export async function findUserWithID(userID: number): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id: userID },
  });
  return user;
}

export async function findUserWithName(username: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { username: username },
  });
  return user;
}

export async function createUser(userInfo: UserInfo): Promise<User> {
  const createdUser = await prisma.user.create({
    data: {
      username: userInfo.username,
      password: userInfo.password,
    },
  });

  return createdUser;
}
