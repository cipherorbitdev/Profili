import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email.")
  .max(120, "Email is too long.")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password is too long.");

export function authFormSchema(isSignup: boolean) {
  return z.object({
    name: isSignup
      ? z.string().trim().min(1, "Name is required.").max(80, "Name is too long.")
      : z.string().optional(),
    email: emailSchema,
    password: passwordSchema,
  });
}

export const forgotSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string().min(1, "Confirm your password."),
  })
  .refine((value) => value.password === value.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export type AuthFormValues = z.infer<ReturnType<typeof authFormSchema>>;
export type ForgotValues = z.infer<typeof forgotSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
