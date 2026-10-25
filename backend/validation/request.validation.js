import { z } from "zod";

export const signupPostRequestBodySchema = z
  .object({
    firstname: z.string(),
    lastname: z.string(),
    email: z.string().email(),
    password: z.string().min(5),
    confirmPassword: z.string().min(5),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginPostRequestBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(5),
});

// Only http(s) targets are allowed (blocks javascript:, data:, file: etc.)
const httpUrl = z
  .string()
  .trim()
  .max(2048, "URL is too long (max 2048 characters)")
  .url("Please enter a valid URL")
  .refine((value) => {
    try {
      const { protocol } = new URL(value);
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }, "Only http:// and https:// URLs can be shortened");

export const aliasSchema = z
  .string()
  .trim()
  .regex(
    /^[a-zA-Z0-9_-]{3,50}$/,
    "Custom alias must be 3-50 characters: letters, numbers, - and _ only"
  );

const futureDate = z
  .string()
  .datetime("Invalid expiry date")
  .refine((v) => new Date(v).getTime() > Date.now(), "Expiry date must be in the future");

const linkPassword = z
  .string()
  .min(4, "Link password must be at least 4 characters")
  .max(100, "Link password is too long");

export const shortenPostRequestBodySchema = z.object({
  url: httpUrl,
  code: aliasSchema.optional().or(z.literal("").transform(() => undefined)),
  deviceId: z.string().max(255).optional(),
  title: z.string().trim().max(120).optional().or(z.literal("").transform(() => undefined)),
  expiresAt: futureDate.optional(),
  password: linkPassword.optional().or(z.literal("").transform(() => undefined)),
  maxClicks: z.coerce.number().int().min(1).max(10_000_000).optional(),
});

// PATCH /:id — every field optional; `null` clears the value
export const updateUrlBodySchema = z
  .object({
    url: httpUrl,
    title: z.string().trim().max(120).nullable(),
    expiresAt: futureDate.nullable(),
    password: linkPassword.nullable(),
    maxClicks: z.coerce.number().int().min(1).max(10_000_000).nullable(),
    isActive: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Nothing to update");

export const analyticsQuerySchema = z.object({
  days: z.coerce.number().int().refine((d) => [7, 30, 90].includes(d), "days must be 7, 30 or 90").default(30),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resendOtpSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(5),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(5),
});
