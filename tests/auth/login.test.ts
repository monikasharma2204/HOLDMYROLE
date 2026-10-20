import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { GET as meHandler } from "@/app/api/auth/me/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { hashPassword } from "@/lib/auth/password";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";
import { createMockRequest, clearTestDatabase, testPrisma } from "../helpers";

describe("POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout", () => {
  beforeEach(async () => {
    await clearTestDatabase();
    // Seed a known test user
    const passwordHash = await hashPassword("ValidPassword123!");
    await testPrisma.user.create({
      data: {
        name: "Test Customer",
        email: "test@example.com",
        passwordHash,
        role: "CUSTOMER",
      },
    });
  });

  afterAll(async () => {
    await clearTestDatabase();
    await testPrisma.$disconnect();
  });

  it("should successfully authenticate with valid credentials and set HttpOnly cookie", async () => {
    const req = createMockRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: {
        email: "test@example.com",
        password: "ValidPassword123!",
      },
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.user.email).toBe("test@example.com");
    expect(json.data.user.role).toBe("CUSTOMER");
    expect(json.data.user.passwordHash).toBeUndefined();
    expect(json.data.token).toBeDefined();

    // Verify Set-Cookie header contains HttpOnly cookie
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).not.toBeNull();
    expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(setCookie?.toLowerCase()).toContain("httponly");
    expect(setCookie?.toLowerCase()).toContain("samesite=lax");
  });

  it("should reject incorrect password with 401 INVALID_CREDENTIALS", async () => {
    const req = createMockRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: {
        email: "test@example.com",
        password: "WrongPassword999!",
      },
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("should reject unknown email with 401 INVALID_CREDENTIALS", async () => {
    const req = createMockRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: {
        email: "nonexistent@example.com",
        password: "SomePassword123!",
      },
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("should retrieve profile via GET /api/auth/me when authenticated", async () => {
    // 1. Perform login
    const loginReq = createMockRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: {
        email: "test@example.com",
        password: "ValidPassword123!",
      },
    });
    const loginRes = await loginHandler(loginReq);
    const { token } = (await loginRes.json()).data;

    // 2. Fetch /api/auth/me using Cookie
    const meCookieReq = createMockRequest("http://localhost:3000/api/auth/me", {
      token,
      tokenType: "cookie",
    });
    const meCookieRes = await meHandler(meCookieReq);
    expect(meCookieRes.status).toBe(200);
    const meCookieJson = await meCookieRes.json();
    expect(meCookieJson.data.user.email).toBe("test@example.com");

    // 3. Fetch /api/auth/me using Bearer header
    const meBearerReq = createMockRequest("http://localhost:3000/api/auth/me", {
      token,
      tokenType: "bearer",
    });
    const meBearerRes = await meHandler(meBearerReq);
    expect(meBearerRes.status).toBe(200);
    const meBearerJson = await meBearerRes.json();
    expect(meBearerJson.data.user.email).toBe("test@example.com");
  });

  it("should clear session cookie on POST /api/auth/logout", async () => {
    const req = createMockRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
    });
    const res = await logoutHandler(req);
    expect(res.status).toBe(200);

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).not.toBeNull();
    // Cookie is cleared with max-age=0
    expect(setCookie).toContain("Max-Age=0");
  });
});
