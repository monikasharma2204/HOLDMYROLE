import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/categories
 * Public endpoint returning list of distinct categories for active products.
 */
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        category: true,
      },
      distinct: ["category"],
      orderBy: {
        category: "asc",
      },
    });

    const categoryList = categories.map((c) => c.category);

    return successResponse(categoryList);
  } catch (err) {
    console.error("Error in GET /api/categories:", err);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred while fetching categories.",
      500
    );
  }
}
