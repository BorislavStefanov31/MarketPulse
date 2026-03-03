import { z } from "zod";

export const signupSchema = z.object({
  email: z.string(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const refreshSchema = z.object({
  refreshToken: z.string(),
});
