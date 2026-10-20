import { NextRequest } from "next/server";
import {
  productIdParamSchema,
  updateProductSchema,
} from "@/lib/validation/product";
import { parseAndValidateBody } from "@/lib/api/request";
import { successResponse, errorResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { formatProduct } from "@/lib/utils/format";
import { createUniqueSlug } from "@/lib/utils/slug";
import prisma from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/products/[id]
 * Public endpoint to fetch an active product by UUID.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const paramParsed = productIdParamSchema.safeParse(params);
    if (!paramParsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid product ID format. Must be a valid UUID.",
        400
      );
    }

    const { id } = paramParsed.data;

    // Public detail view only returns active products
    const product = await prisma.product.findFirst({
      where: {
        id,
        isActive: true,
      },
    });

    if (!product) {
      return errorResponse(
        "NOT_FOUND",
        "Product not found or is currently inactive.",
        404
      );
    }

    return successResponse(formatProduct(product));
  } catch (err) {
    console.error(`Error in GET /api/products/[id]:`, err);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred while fetching the product.",
      500
    );
  }
}

/**
 * PATCH /api/products/[id]
 * Admin-only endpoint to partially update a product.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Authorize: Admin only
    const { error: authError } = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    // 2. Validate route param
    const paramParsed = productIdParamSchema.safeParse(params);
    if (!paramParsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid product ID format. Must be a valid UUID.",
        400
      );
    }

    const { id } = paramParsed.data;

    // 3. Check if target product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return errorResponse(
        "NOT_FOUND",
        "Product not found.",
        404
      );
    }

    // 4. Validate body
    const { data, error: validationError } = await parseAndValidateBody(
      request,
      updateProductSchema
    );
    if (validationError) {
      return validationError;
    }

    // 5. If name is being changed, update the unique slug
    let updatedSlug: string | undefined = undefined;
    if (data.name && data.name !== existingProduct.name) {
      updatedSlug = await createUniqueSlug(
        data.name,
        async (candidateSlug) => {
          const conflict = await prisma.product.findFirst({
            where: {
              slug: candidateSlug,
              NOT: { id },
            },
            select: { id: true },
          });
          return !!conflict;
        },
        id
      );
    }

    // 6. Build update payload
    const updateData: Prisma.ProductUpdateInput = {
      ...(data.name ? { name: data.name } : {}),
      ...(updatedSlug ? { slug: updatedSlug } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.price !== undefined ? { price: new Prisma.Decimal(data.price) } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl || null } : {}),
      ...(data.stock !== undefined ? { stock: data.stock } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    };

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return successResponse(formatProduct(updatedProduct));
  } catch (err) {
    console.error(`Error in PATCH /api/products/[id]:`, err);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred while updating the product.",
      500
    );
  }
}

/**
 * DELETE /api/products/[id]
 * Admin-only endpoint to delete a product.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Authorize: Admin only
    const { error: authError } = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    // 2. Validate route param
    const paramParsed = productIdParamSchema.safeParse(params);
    if (!paramParsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid product ID format. Must be a valid UUID.",
        400
      );
    }

    const { id } = paramParsed.data;

    // 3. Check if target product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return errorResponse(
        "NOT_FOUND",
        "Product not found.",
        404
      );
    }

    // 4. Delete product
    await prisma.product.delete({
      where: { id },
    });

    return successResponse({
      message: `Product '${existingProduct.name}' has been successfully deleted.`,
    });
  } catch (err) {
    console.error(`Error in DELETE /api/products/[id]:`, err);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred while deleting the product.",
      500
    );
  }
}
