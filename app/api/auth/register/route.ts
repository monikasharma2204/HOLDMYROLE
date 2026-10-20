import { NextRequest } from "next/server";
import { registerSchema } from "@/lib/validation/auth";
import { parseAndValidateBody } from "@/lib/api/request";
import { successResponse, errorResponse } from "@/lib/api/response";
import { hashPassword } from "@/lib/auth/password";
import prisma from "@/lib/db/prisma";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { data, error } = await parseAndValidateBody(request, registerSchema);
    if (error) {
      return error;
    }

    const email = data.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse(
        "CONFLICT",
        "A user with this email address already exists.",
        409,
        { email: ["Email address is already registered"] }
      );
    }

    // Hash password with Argon2id
    const passwordHash = await hashPassword(data.password);

    // Public registration always assigns CUSTOMER role
    const newUser = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        passwordHash,
        role: Role.CUSTOMER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(newUser, 201);
  } catch (err) {
    console.error("Error during registration:", err);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred while creating your account.",
      500
    );
  }
}
