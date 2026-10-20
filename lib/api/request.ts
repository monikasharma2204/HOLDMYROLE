import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { errorResponse } from "./response";

/**
 * Safely parse and validate JSON body from a NextRequest using a Zod schema.
 * Handles malformed JSON and validation failures gracefully.
 */
export async function parseAndValidateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let body: any;

  try {
    const text = await request.text();
    if (!text || text.trim() === "") {
      return {
        data: null,
        error: errorResponse(
          "VALIDATION_ERROR",
          "Request body cannot be empty.",
          400
        ),
      };
    }
    body = JSON.parse(text);
  } catch (err) {
    return {
      data: null,
      error: errorResponse(
        "INVALID_JSON",
        "Malformed JSON payload in request body.",
        400
      ),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const formattedErrors = formatZodErrors(result.error);
    return {
      data: null,
      error: errorResponse(
        "VALIDATION_ERROR",
        "The request contains invalid fields.",
        400,
        formattedErrors
      ),
    };
  }

  return { data: result.data, error: null };
}

/**
 * Format Zod validation errors into an easy-to-consume field dictionary.
 */
export function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "body";
    if (!formatted[key]) {
      formatted[key] = [];
    }
    formatted[key].push(issue.message);
  }
  return formatted;
}
