import { z, type SafeParseReturnType } from "zod";
import xss from "xss";
import { getMaxDays } from "./dateHelper.js";

export const userSchema = z.object({
  id: z.number(),
  username: z
    .string()
    .min(3, "username must be atleast 3 letters long")
    .max(1024, "username must be atmost 1024 letters long"),
  password: z.string(), // hashed
});

export const userInfoSchema = z.object({
  username: z
    .string()
    .min(3, "username must be atleast 3 letters long")
    .max(1024, "username must be atmost 1024 letters long")
    .transform((val) => xss(val)),
  password: z
    .string()
    .min(3, "password must be atleast 3 letters long")
    .max(1024, "password must be atmost 1024 letters long"), // unhashed
});

export const dataSchema = z.object({
  id: z.number(),
  year: z
    .number()
    .min(1000, "year cannot be lower than 1000")
    .max(9999, "year cannot be more than 9999"),
  month: z
    .number()
    .min(1, "month cannot be lower than 1")
    .max(12, "month cannot be more than 12"),
  day: z
    .number()
    .min(1, "day cannot be lower than 1")
    .max(31, "day cannot be more than 31"),
  userID: z.number(),
  value: z
    .number()
    .min(1, "value can not be less than 1")
    .max(9999, "value can not be more than 9999"),
});

export const dataInfoSchema = z
  .object({
    year: z
      .number()
      .min(1000, "year cannot be lower than 1000")
      .max(9999, "year cannot be more than 9999"),
    month: z
      .number()
      .min(1, "month cannot be lower than 1")
      .max(12, "month cannot be more than 12"),
    day: z
      .number()
      .min(1, "day cannot be lower than 1")
      .max(31, "day cannot be more than 31"),
    userID: z.number(),
    value: z
      .number()
      .min(1, "value can not be less than 1")
      .max(9999, "value can not be more than 9999"),
  })
  .superRefine((data, ctx) => {
    const { year, month, day } = data;
    const maxDay = getMaxDays(year, month);

    if (day > maxDay) {
      ctx.addIssue({
        path: ["day"],
        message: `Invalid day: ${day}/${month}/${year} is not a real date.`,
        code: z.ZodIssueCode.custom,
      });
    }
  });

export const RenderingDataSchema = z.object({
  maxYear: z.number(),
  maxMonth: z.number(),
  lowestYear: z.number(),
  lowestMonth: z.number(),
  selectedYear: z.number(),
  selectedMonth: z.number(),
  monthDays: z.number(),
  monthData: z
    .array(dataInfoSchema)
    .max(31, "cannot have more than 31 days worth of day data"),
});

export type User = z.infer<typeof userSchema>;
export type UserInfo = z.infer<typeof userInfoSchema>;
export type Data = z.infer<typeof dataSchema>;
export type DataInfo = z.infer<typeof dataInfoSchema>;
export type RenderingData = z.infer<typeof RenderingDataSchema>;

export function userValidator(
  UserInfo: unknown
): SafeParseReturnType<UserInfo, UserInfo> {
  const result = userInfoSchema.safeParse(UserInfo);
  return result;
}

export function dataValidator(
  DataInfo: unknown
): SafeParseReturnType<DataInfo, DataInfo> {
  const result = dataInfoSchema.safeParse(DataInfo);
  return result;
}
