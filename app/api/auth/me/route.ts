import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { successResponse, errorResponse } from "@/lib/api/response";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAuth(request);
    if (error) {
      return error;
    }

    // Fetch fresh user profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return errorResponse("UNAUTHORIZED", "User profile not found.", 401);
    }

    return successResponse({ user });
  } catch (err) {
    console.error("Error in /api/auth/me:", err);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred while fetching user profile.",
      500
    );
  }
}
