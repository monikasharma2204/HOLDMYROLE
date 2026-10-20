import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { POST } from "@/app/api/auth/register/route";
import { createMockRequest, clearTestDatabase, testPrisma } from "../helpers";

describe("POST /api/auth/register", () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await clearTestDatabase();
    await testPrisma.$disconnect();
  });

  it("should successfully register a new user as CUSTOMER", async () => {
    const req = createMockRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: {
        name: "Alice Candidate",
        email: "alice@example.com",
        password: "SecurePassword123!",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.name).toBe("Alice Candidate");
    expect(json.data.email).toBe("alice@example.com");
    expect(json.data.role).toBe("CUSTOMER");
    expect(json.data.id).toBeDefined();
    // Verify password hash is NEVER exposed
    expect(json.data.passwordHash).toBeUndefined();
    expect(json.data.password).toBeUndefined();

    // Verify persisted in database
    const dbUser = await testPrisma.user.findUnique({
      where: { email: "alice@example.com" },
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.role).toBe("CUSTOMER");
    expect(dbUser?.passwordHash).toContain("$argon2id$");
  });

  it("should reject duplicate registration with 409 CONFLICT", async () => {
    // First registration
    const req1 = createMockRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: {
        name: "Alice Candidate",
        email: "alice@example.com",
        password: "SecurePassword123!",
      },
    });
    await POST(req1);

    // Duplicate registration attempt
    const req2 = createMockRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: {
        name: "Alice Imposter",
        email: "ALICE@example.com", // Normalized lowercase test
        password: "AnotherPassword123!",
      },
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(409);

    const json = await res2.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("CONFLICT");
  });

  it("should reject invalid inputs with 400 VALIDATION_ERROR", async () => {
    const req = createMockRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: {
        name: "A", // too short
        email: "not-an-email",
        password: "short", // less than 8 chars
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.details).toBeDefined();
    expect(json.error.details.name).toBeDefined();
    expect(json.error.details.email).toBeDefined();
    expect(json.error.details.password).toBeDefined();
  });

  it("should handle malformed JSON gracefully", async () => {
    const rawReq = new (await import("next/server")).NextRequest(
      new URL("http://localhost:3000/api/auth/register"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ malformed json...",
      }
    );

    const res = await POST(rawReq);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_JSON");
  });
});
