import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { signToken } from "@/lib/auth/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://lakshya@127.0.0.1:5433/ecommerce_test?schema=public",
    },
  },
});

/**
 * Clean up test database tables before or after test suites.
 */
export async function clearTestDatabase() {
  await testPrisma.product.deleteMany({});
  await testPrisma.user.deleteMany({});
}

/**
 * Helper to construct NextRequest for testing route handlers.
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    token?: string;
    tokenType?: "cookie" | "bearer";
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = "GET", body, token, tokenType = "cookie", headers = {} } = options;

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Host", "localhost:3000");

  if (body) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token && tokenType === "bearer") {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  // Ensure origin is set for state-changing cookie requests
  if (["POST", "PATCH", "PUT", "DELETE"].includes(method.toUpperCase())) {
    requestHeaders.set("Origin", "http://localhost:3000");
  }

  const req = new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (token && tokenType === "cookie") {
    req.cookies.set(AUTH_COOKIE_NAME, token);
  }

  return req;
}

/**
 * Generate a valid JWT token for a test user.
 */
export async function generateTestToken(user: {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "CUSTOMER";
}, expiresIn: string = "1h"): Promise<string> {
  return await signToken(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    expiresIn
  );
}
