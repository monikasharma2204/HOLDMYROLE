import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string({ required_error: "Product name is required" })
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(150, "Product name must not exceed 150 characters"),
  description: z
    .string({ required_error: "Product description is required" })
    .trim()
    .min(5, "Product description must be at least 5 characters")
    .max(5000, "Product description must not exceed 5000 characters"),
  price: z.coerce
    .number({ required_error: "Price is required" })
    .positive("Price must be greater than zero")
    .max(1000000, "Price exceeds maximum allowable limit (1,000,000)"),
  category: z
    .string({ required_error: "Category is required" })
    .trim()
    .min(2, "Category must be at least 2 characters")
    .max(50, "Category must not exceed 50 characters"),
  imageUrl: z
    .string()
    .trim()
    .url("Image URL must be a valid URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  stock: z.coerce
    .number({ required_error: "Stock is required" })
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative")
    .max(1000000, "Stock exceeds maximum allowable limit"),
  isActive: z.boolean().optional().default(true),
});

export const updateProductSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Product name must be at least 2 characters")
      .max(150, "Product name must not exceed 150 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .min(5, "Product description must be at least 5 characters")
      .max(5000, "Product description must not exceed 5000 characters")
      .optional(),
    price: z.coerce
      .number()
      .positive("Price must be greater than zero")
      .max(1000000, "Price exceeds maximum allowable limit")
      .optional(),
    category: z
      .string()
      .trim()
      .min(2, "Category must be at least 2 characters")
      .max(50, "Category must not exceed 50 characters")
      .optional(),
    imageUrl: z
      .string()
      .trim()
      .url("Image URL must be a valid URL")
      .optional()
      .nullable()
      .or(z.literal("")),
    stock: z.coerce
      .number()
      .int("Stock must be an integer")
      .min(0, "Stock cannot be negative")
      .max(1000000, "Stock exceeds maximum allowable limit")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  sortBy: z.enum(["name", "price", "createdAt", "stock"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const productIdParamSchema = z.object({
  id: z.string().uuid("Invalid product ID format (must be a valid UUID)"),
});

export const productSlugParamSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
