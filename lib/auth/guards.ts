import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, AuthSession } from "./session";
import { errorResponse } from "@/lib/api/response";

export type GuardResult =
  | { session: AuthSession; error: null }
  | { session: null; error: NextResponse };

/**
 * Enforces that the request is made by an authenticated user.
 * Returns 401 UNAUTHORIZED if missing or invalid token.
 */
export async function requireAuth(request: NextRequest): Promise<GuardResult> {
  const session = await getAuthSession(request);

  if (!session) {
    return {
      session: null,
      error: errorResponse(
        "UNAUTHORIZED",
        "Authentication is required to access this resource. Please log in.",
        401
      ),
    };
  }

  return { session, error: null };
}

/**
 * Enforces that the request is made by an authenticated user with ADMIN role.
 * Returns 401 UNAUTHORIZED if not logged in.
 * Returns 403 FORBIDDEN if logged in as CUSTOMER.
 */
export async function requireAdmin(request: NextRequest): Promise<GuardResult> {
  const session = await getAuthSession(request);

  if (!session) {
    return {
      session: null,
      error: errorResponse(
        "UNAUTHORIZED",
        "Authentication is required to perform this administrative action.",
        401
      ),
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      session: null,
      error: errorResponse(
        "FORBIDDEN",
        "You do not have permission to perform this administrative operation.",
        403
      ),
    };
  }

  return { session, error: null };
}
