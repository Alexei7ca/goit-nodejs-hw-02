import { z } from "zod";
import { registry } from "../openapi.ts";

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .openapi({ example: "ivan_petrenko" }),
    email: z
      .string()
      .email("Invalid email address")
      .openapi({ example: "ivan@example.com" }),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .openapi({ example: "password123" }),
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .openapi({ example: "Іван" }),
  })
  .openapi("RegisterRequest");

export const loginSchema = z
  .object({
    username: z
      .string()
      .min(1, "Username is required")
      .openapi({ example: "ivan_petrenko" }),
    password: z
      .string()
      .min(1, "Password is required")
      .openapi({ example: "password123" }),
  })
  .openapi("LoginRequest");

export const refreshSchema = z
  .object({
    refreshToken: z
      .string()
      .min(1, "Refresh token is required")
      .openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }),
  })
  .openapi("RefreshRequest");

export const userSummarySchema = z
  .object({
    id: z.number().int().openapi({ example: 1 }),
    username: z.string().openapi({ example: "ivan_petrenko" }),
    email: z.string().email().openapi({ example: "ivan@example.com" }),
    name: z.string().openapi({ example: "Іван" }),
  })
  .openapi("UserSummary");

export const userProfileSchema = userSummarySchema
  .extend({
    createdAt: z
      .string()
      .datetime()
      .openapi({ example: "2025-01-10T12:00:00.000Z" }),
  })
  .openapi("UserProfile");

export const authResponseSchema = z
  .object({
    user: userSummarySchema,
    accessToken: z
      .string()
      .openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }),
    refreshToken: z
      .string()
      .openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }),
  })
  .openapi("AuthResponse");

export const tokenPairResponseSchema = z
  .object({
    accessToken: z
      .string()
      .openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }),
    refreshToken: z
      .string()
      .openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }),
  })
  .openapi("TokenPairResponse");

export const errorResponseSchema = z
  .object({
    error: z.string().openapi({ example: "Error description" }),
  })
  .openapi("ErrorResponse");

registry.register("RegisterRequest", registerSchema);
registry.register("LoginRequest", loginSchema);
registry.register("RefreshRequest", refreshSchema);
registry.register("UserSummary", userSummarySchema);
registry.register("UserProfile", userProfileSchema);
registry.register("AuthResponse", authResponseSchema);
registry.register("TokenPairResponse", tokenPairResponseSchema);
registry.register("ErrorResponse", errorResponseSchema);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
