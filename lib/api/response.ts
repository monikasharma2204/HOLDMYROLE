import { NextResponse } from "next/server";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  pagination?: PaginationMeta;
}

export interface ApiErrorDetail {
  [key: string]: any;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail;
  };
}

/**
 * Return a standard JSON success response
 */
export function successResponse<T>(data: T, status = 200, headers?: HeadersInit) {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
  };
  return NextResponse.json(body, { status, headers });
}

/**
 * Return a standard JSON paginated success response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  status = 200,
  headers?: HeadersInit
) {
  const body: ApiSuccessResponse<T[]> = {
    success: true,
    data,
    pagination,
  };
  return NextResponse.json(body, { status, headers });
}

/**
 * Return a standard JSON error response
 */
export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: ApiErrorDetail,
  headers?: HeadersInit
) {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return NextResponse.json(body, { status, headers });
}
