import { NextRequest } from "next/server";
import { productSlugParamSchema } from "@/lib/validation/product";
import { successResponse, errorResponse } from "@/lib/api/response";
import { formatProduct } from "@/lib/utils/format";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    slug: string;
  };
}

/**
 * GET /api/products/slug/[slug]
 * Public endpoint to fetch an active product by unique slug.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const parsed = productSlugParamSchema.safeParse(params);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid product slug format.",
        400
      );
    }

    const { slug } = parsed.data;

    const product = await prisma.product.findFirst({
      where: {
        slug,
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
    console.error("Error in GET /api/products/slug/[slug]:", err);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred while fetching the product.",
      500
    );
  }
}
