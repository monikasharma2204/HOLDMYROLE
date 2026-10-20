import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { GET as meHandler } from "@/app/api/auth/me/route";
import { generateTestToken, createMockRequest, clearTestDatabase, testPrisma } from "../helpers";
import { SignJWT } from "jose";

describe("JWT Signature and Expiration Verification", () => {
  let testUser: { id: string; email: string; name: string; role: "CUSTOMER" };

  beforeEach(async () => {
    await clearTestDatabase();
    testUser = await testPrisma.user.create({
      data: {
        name: "Security Tester",
        email: "security@example.com",
        passwordHash: "dummyhash",
        role: "CUSTOMER",
      },
    });
  });

  afterAll(async () => {
    await clearTestDatabase();
    await testPrisma.$disconnect();
  });

  it("should reject request when no token is provided", async () => {
    const req = createMockRequest("http://localhost:3000/api/auth/me");
    const res = await meHandler(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("should reject request when token has an invalid signature", async () => {
    // Sign token with a fake secret key
    const fakeSecret = new TextEncoder().encode("wrong-secret-key-that-does-not-match-at-all-12345");
    const forgedToken = await new SignJWT({
      sub: testUser.id,
      email: testUser.email,
      name: testUser.name,
      role: testUser.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(fakeSecret);

    const req = createMockRequest("http://localhost:3000/api/auth/me", {
      token: forgedToken,
      tokenType: "bearer",
    });

    const res = await meHandler(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("should reject expired token", async () => {
    // Generate token that expired 1 second in the past
    const expiredToken = await generateTestToken(testUser, "-1s");

    const req = createMockRequest("http://localhost:3000/api/auth/me", {
      token: expiredToken,
      tokenType: "bearer",
    });

    const res = await meHandler(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });
});
