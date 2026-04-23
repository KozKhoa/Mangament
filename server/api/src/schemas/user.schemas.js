import { z } from "zod";
import { dateSchema, imageSchema, genderSchema } from "./default.schemas.js";

export class UserSchemas {
  getUser = z.object({
    params: z.any().optional(),
    query: z.any().optional(),
    body: z.any().optional(),
  });

  updateProfile = z.object({
    params: z.any().optional(),
    query: z.any().optional(),
    body: z.object({
      name: z.string().min(1, "Name must be at least 1 characters").optional(),
      birthday: dateSchema.optional(),
      avatar: imageSchema.optional(),
      gender: genderSchema.optional(),
    }),
  });

  changePassword = z.object({
    params: z.any().optional(),
    query: z.any().optional(),
    body: z
      .object({
        oldPassword: z.string().min(6, "Old password must be at least 6 characters"),
        newPassword: z.string().min(6, "New password must be at least 6 characters"),
      })
      .refine((data) => data.oldPassword !== data.newPassword, {
        message: "New password must be different from the old password",
      }),
  });
}

const userSchemas = new UserSchemas();
export default userSchemas;
