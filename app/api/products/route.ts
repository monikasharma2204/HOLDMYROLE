import { NextRequest } from "next/server";
import { productQuerySchema, createProductSchema } from "@/lib/validation/product";
import { parseAndValidateBody, formatZodErrors } from "@/lib/api/request";
import {
  paginatedResponse,
  successResponse,
  errorResponse,
} from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { formatProduct } from "@/lib/utils/format";
import { createUniqueSlug } from "@/lib/utils/slug";
import prisma from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/products
 * Public endpoint to list and search active products with pagination and sorting.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryParamsRaw = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      order: searchParams.get("order") ?? undefined,
    };

    const queryParsed = productQuerySchema.safeParse(queryParamsRaw);
    if (!queryParsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid query parameters provided.",
        400,
        formatZodErrors(queryParsed.error)
      );
    }

    const { page, limit, search, category, sortBy, order } = queryParsed.data;

    // Build filter: only active products are visible publicly
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(search
        ? {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(category
        ? {
            category: {
              equals: category,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: {
          [sortBy]: order,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const formattedProducts = products.map(formatProduct);
    const totalPages = Math.ceil(total / limit);

    return paginatedResponse(formattedProducts, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (err) {
    console.error("Error in GET /api/products:", err);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred while fetching products.",
      500
    );
  }
}

/**
 * POST /api/products
 * Admin-only endpoint to create a new product.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authorize: Admin only
    const { error: authError } = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    // 2. Validate request body
    const { data, error: validationError } = await parseAndValidateBody(
      request,
      createProductSchema
    );
    if (validationError) {
      return validationError;
    }

    // 3. Generate unique slug
    const uniqueSlug = await createUniqueSlug(data.name, async (candidateSlug) => {
      const exists = await prisma.product.findUnique({
        where: { slug: candidateSlug },
        select: { id: true },
      });
      return !!exists;
    });

    // 4. Create product with Decimal price
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: uniqueSlug,
        description: data.description,
        price: new Prisma.Decimal(data.price),
        category: data.category,
        imageUrl: data.imageUrl || null,
        stock: data.stock,
        isActive: data.isActive ?? true,
      },
    });

    return successResponse(formatProduct(product), 201);
  } catch (err) {
    console.error("Error in POST /api/products:", err);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred while creating the product.",
      500
    );
  }
}
