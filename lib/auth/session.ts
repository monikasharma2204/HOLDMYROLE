import { NextRequest } from "next/server";
import { verifyToken, TokenPayload } from "./jwt";
import prisma from "@/lib/db/prisma";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "CUSTOMER";
}

export interface AuthSession {
  user: AuthenticatedUser;
  authMethod: "cookie" | "bearer";
}

export const AUTH_COOKIE_NAME = process.env.COOKIE_NAME || "auth_token";

/**
 * Standard cookie configuration for session management.
 */
export function getAuthCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    name: AUTH_COOKIE_NAME,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  };
}

/**
 * Validate CSRF for cookie-based state-changing requests.
 * Returns true if valid or if not a cookie-authenticated state-changing request.
 */
export function validateCsrf(
  request: NextRequest,
  authMethod: "cookie" | "bearer"
): boolean {
  // Bearer tokens are not vulnerable to CSRF because browsers never attach them automatically
  if (authMethod === "bearer") {
    return true;
  }

  // Safe HTTP methods do not change state
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(request.method)) {
    return true;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin) {
    // Some non-browser clients or same-origin form posts may omit origin; check referer or custom header
    const referer = request.headers.get("referer");
    if (referer && host) {
      try {
        const refererUrl = new URL(referer);
        return refererUrl.host === host;
      } catch {
        return false;
      }
    }
    // If neither origin nor referer is provided, check for custom header
    const customHeader = request.headers.get("x-requested-with");
    return !!customHeader;
  }

  try {
    const originUrl = new URL(origin);
    if (host && originUrl.host === host) {
      return true;
    }
    // Also compare with configured app url
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      const configuredUrl = new URL(appUrl);
      if (originUrl.host === configuredUrl.host) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Extracts and verifies the authenticated user from the incoming request.
 * Checks Authorization header first, then HttpOnly cookie.
 * Validates JWT cryptographic signature and database user existence.
 */
export async function getAuthSession(
  request: NextRequest
): Promise<AuthSession | null> {
  let token: string | null = null;
  let authMethod: "cookie" | "bearer" = "cookie";

  // 1. Check Authorization Bearer header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.substring(7).trim();
    authMethod = "bearer";
  }

  // 2. Fall back to HttpOnly cookie
  if (!token) {
    const cookie = request.cookies.get(AUTH_COOKIE_NAME);
    if (cookie?.value) {
      token = cookie.value;
      authMethod = "cookie";
    }
  }

  if (!token) {
    return null;
  }

  // 3. Cryptographically verify JWT signature and expiration
  const payload = await verifyToken(token);
  if (!payload || !payload.sub) {
    return null;
  }

  // 4. Validate CSRF for cookie-based state-changing requests
  if (!validateCsrf(request, authMethod)) {
    return null;
  }

  // 5. Query user from database to ensure account still exists and role is current
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    authMethod,
  };
}
