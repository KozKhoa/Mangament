import { z } from "zod";

import { Gender } from "../../configs/db.js";

export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  sort: z
    .string()
    .refine((value) => /^\w+:(asc|desc)$/.test(value), "Invalid sort format")
    .transform((value) => value.split(":"))
    .transform(([field, direction]) => ({ [field]: direction }))
    .optional(),
});

export const arrayStringSchema = z.string().transform((value) => value?.split(",").map((item) => item.trim()));

export const arrayNumberSchema = z.string().transform((value) => value?.split(",").map((item) => Number(item)));

export const arrayOfRangeNumberSchema = z.string().transform((value) => value?.split(",").map((range) => range.split("-").map((number) => parseFloat(number))));

export const booleanSchema = z.string().transform((val) => val === "true" || val === "1");

export const dateSchema = z
  .string()
  .refine((value) => !isNaN(Date.parse(value)), {
    message: "Invalid date format",
  })
  .transform((value) => new Date(value));

export const imageSchema = z.object({ url: z.string().url().optional(), key: z.string() });

export const genderSchema = z.enum(Object.values(Gender));
