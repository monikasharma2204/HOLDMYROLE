import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api/response";
import { getAuthCookieOptions } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const response = successResponse({
    message: "Successfully logged out.",
  });

  const cookieOptions = getAuthCookieOptions();

  // Clear authentication cookie
  response.cookies.set({
    name: cookieOptions.name,
    value: "",
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
