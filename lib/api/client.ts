/**
 * Reusable Frontend API Client for Intern Assessment
 * Handles typed requests, cookie-based sessions, and standardized error parsing.
 */

export interface ApiResponse<T> {
  success: true;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorPayload {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, string[]>;

  constructor(message: string, code: string, status: number, details?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string | null;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: "name" | "price" | "createdAt" | "stock";
  order?: "asc" | "desc";
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  // Set header to assist CSRF validation on cookie-authenticated requests
  if (!headers.has("X-Requested-With")) {
    headers.set("X-Requested-With", "XMLHttpRequest");
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
    credentials: "include", // Send and receive HttpOnly session cookies
  });

  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  let payload: any = null;
  if (isJson) {
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
  }

  if (!res.ok || !payload?.success) {
    const errorData = (payload as ApiErrorPayload)?.error;
    throw new ApiError(
      errorData?.message || `Request failed with status ${res.status}`,
      errorData?.code || "HTTP_ERROR",
      res.status,
      errorData?.details
    );
  }

  return payload as ApiResponse<T>;
}

export const apiClient = {
  auth: {
    async register(data: { name: string; email: string; password: string }) {
      return request<UserProfile>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async login(data: { email: string; password: string }) {
      return request<{ user: UserProfile; token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async me() {
      return request<{ user: UserProfile }>("/api/auth/me", {
        method: "GET",
      });
    },

    async logout() {
      return request<{ message: string }>("/api/auth/logout", {
        method: "POST",
      });
    },
  },

  products: {
    async list(params: ProductListParams = {}) {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set("page", params.page.toString());
      if (params.limit) searchParams.set("limit", params.limit.toString());
      if (params.search) searchParams.set("search", params.search);
      if (params.category) searchParams.set("category", params.category);
      if (params.sortBy) searchParams.set("sortBy", params.sortBy);
      if (params.order) searchParams.set("order", params.order);

      const query = searchParams.toString();
      const url = `/api/products${query ? `?${query}` : ""}`;
      return request<ProductItem[]>(url, { method: "GET" });
    },

    async getById(id: string) {
      return request<ProductItem>(`/api/products/${id}`, { method: "GET" });
    },

    async getBySlug(slug: string) {
      return request<ProductItem>(`/api/products/slug/${slug}`, { method: "GET" });
    },

    async create(data: {
      name: string;
      description: string;
      price: number;
      category: string;
      imageUrl?: string | null;
      stock: number;
      isActive?: boolean;
    }) {
      return request<ProductItem>("/api/products", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async update(
      id: string,
      data: Partial<{
        name: string;
        description: string;
        price: number;
        category: string;
        imageUrl?: string | null;
        stock: number;
        isActive?: boolean;
      }>
    ) {
      return request<ProductItem>(`/api/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    async delete(id: string) {
      return request<{ message: string }>(`/api/products/${id}`, {
        method: "DELETE",
      });
    },
  },

  categories: {
    async list() {
      return request<string[]>("/api/categories", { method: "GET" });
    },
  },
};
