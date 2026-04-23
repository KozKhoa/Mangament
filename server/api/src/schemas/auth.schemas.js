import { z } from "zod";

export class AuthSchemas {
  register = z.object({
    body: z.object({
      name: z.string({ message: "Name is required" }).min(1, "Name must be at least 1 characters"),
      email: z.string({ message: "Email is required" }).email(),
      password: z.string({ message: "Password is required" }).min(6, { message: "Password must be at least 6 characters long" }),
    }),
    params: z.any().optional(),
    query: z.any().optional(),
  });

  login = z.object({
    body: z.object({
      email: z.string({ message: "Email is required" }).email({ message: "Email is invalid" }),
      password: z.string({ message: "Password is required" }).min(6, "Password must be at least 6 characters"),
    }),
    params: z.any().optional(),
    query: z.any().optional(),
  });

  changePassword = z.object({
    body: z
      .object({
        oldPassword: z.string({ message: "Old password is required" }).min(6, "Old password must be at least 6 characters"),
        newPassword: z.string({ message: "New password is required" }).min(6, "New password must be at least 6 characters"),
      })
      .refine((data) => data.oldPassword !== data.newPassword, {
        message: "New password must be different from the old password",
      }),
    params: z.any().optional(),
    query: z.any().optional(),
  });

  forgotPassword = z.object({
    body: z.object({
      email: z.string({ message: "Email is required" }).email(),
    }),
    params: z.any().optional(),
    query: z.any().optional(),
  });

  resetPassword = z.object({
    body: z.object({
      email: z.string({ message: "Email is required" }).email(),
      otp: z.string({ message: "OTP is required" }).length(6, "OTP must be 6 characters"),
    }),
    params: z.any().optional(),
    query: z.any().optional(),
  });
}

const authShemas = new AuthSchemas();
export default authShemas;
