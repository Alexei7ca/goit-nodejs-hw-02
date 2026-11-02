import { z } from "zod";
import { registry } from "../openapi.ts";
import { userSummarySchema } from "./auth.validator.ts";

export const announcementCategorySchema = z.enum([
  "sale",
  "service",
  "job",
  "other",
]);

export const createAnnouncementSchema = z
  .object({
    title: z
      .string()
      .min(5, "Title must be at least 5 characters")
      .max(50, "Title must be at most 50 characters")
      .openapi({ example: "Продам ноутбук ASUS" }),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .openapi({ example: "Відмінний стан, 16GB RAM" }),
    price: z
      .number()
      .positive("Price must be greater than 0")
      .openapi({ example: 18000 }),
    category: announcementCategorySchema.openapi({ example: "sale" }),
  })
  .openapi("CreateAnnouncementRequest");

export const updateAnnouncementSchema = createAnnouncementSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  })
  .openapi("UpdateAnnouncementRequest");

export const announcementIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive("ID must be a positive integer")
    .openapi({
      param: {
        name: "id",
        in: "path",
      },
      example: 1,
    }),
});

export const listAnnouncementsQuerySchema = z.object({
  search: z
    .string()
    .optional()
    .openapi({
      param: {
        name: "search",
        in: "query",
      },
      example: "ASUS",
    }),
  sort: z
    .enum(["newest", "oldest"])
    .optional()
    .default("newest")
    .openapi({
      param: {
        name: "sort",
        in: "query",
      },
      example: "newest",
    }),
  page: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(1)
    .openapi({
      param: {
        name: "page",
        in: "query",
      },
      example: 1,
    }),
});

export const announcementResponseSchema = z
  .object({
    id: z.number().int().openapi({ example: 5 }),
    title: z.string().openapi({ example: "Продам ноутбук ASUS" }),
    description: z.string().openapi({ example: "Відмінний стан, 16GB RAM" }),
    price: z.number().openapi({ example: 18000 }),
    category: announcementCategorySchema.openapi({ example: "sale" }),
    createdAt: z
      .string()
      .datetime()
      .openapi({ example: "2025-01-10T12:00:00.000Z" }),
    updatedAt: z
      .string()
      .datetime()
      .openapi({ example: "2025-01-10T12:00:00.000Z" }),
    user: userSummarySchema,
  })
  .openapi("AnnouncementResponse");

export const paginationSchema = z
  .object({
    total: z.number().int().openapi({ example: 23 }),
    page: z.number().int().openapi({ example: 2 }),
    totalPages: z.number().int().openapi({ example: 3 }),
    perPage: z.number().int().openapi({ example: 10 }),
  })
  .openapi("PaginationMeta");

export const paginatedAnnouncementsResponseSchema = z
  .object({
    data: z.array(announcementResponseSchema),
    pagination: paginationSchema,
  })
  .openapi("PaginatedAnnouncementsResponse");

registry.register("CreateAnnouncementRequest", createAnnouncementSchema);
registry.register("UpdateAnnouncementRequest", updateAnnouncementSchema);
registry.register("AnnouncementResponse", announcementResponseSchema);
registry.register("PaginationMeta", paginationSchema);
registry.register(
  "PaginatedAnnouncementsResponse",
  paginatedAnnouncementsResponseSchema,
);

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type ListAnnouncementsQuery = z.infer<
  typeof listAnnouncementsQuerySchema
>;
