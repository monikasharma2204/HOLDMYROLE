import { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validation/auth";
import { parseAndValidateBody } from "@/lib/api/request";
import { successResponse, errorResponse } from "@/lib/api/response";
import { verifyPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { getAuthCookieOptions } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { data, error } = await parseAndValidateBody(request, loginSchema);
    if (error) {
      return error;
    }

    const email = data.email.toLowerCase().trim();

    // Query user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return generic error to prevent user enumeration
      return errorResponse(
        "INVALID_CREDENTIALS",
        "Invalid email address or password.",
        401
      );
    }

    // Verify password with Argon2id
    const isPasswordValid = await verifyPassword(user.passwordHash, data.password);
    if (!isPasswordValid) {
      return errorResponse(
        "INVALID_CREDENTIALS",
        "Invalid email address or password.",
        401
      );
    }

    // Generate JWT
    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Build success response with cookie
    const response = successResponse({
      user: safeUser,
      token, // Also provided in payload for API clients like Postman or mobile clients
    });

    // Set HttpOnly, Secure, SameSite cookie
    const cookieOptions = getAuthCookieOptions();
    response.cookies.set({
      name: cookieOptions.name,
      value: token,
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (err) {
    console.error("Error during login:", err);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred during login.",
      500
    );
  }
}
