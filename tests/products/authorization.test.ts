import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { POST as createProductHandler } from "@/app/api/products/route";
import {
  PATCH as updateProductHandler,
  DELETE as deleteProductHandler,
} from "@/app/api/products/[id]/route";
import {
  generateTestToken,
  createMockRequest,
  clearTestDatabase,
  testPrisma,
} from "../helpers";

describe("Role-based Authorization Guards on Product Operations", () => {
  let customerUser: any;
  let adminUser: any;
  let customerToken: string;
  let adminToken: string;
  let testProduct: any;

  beforeEach(async () => {
    await clearTestDatabase();

    customerUser = await testPrisma.user.create({
      data: {
        name: "Regular Customer",
        email: "customer@example.com",
        passwordHash: "dummyhash",
        role: "CUSTOMER",
      },
    });

    adminUser = await testPrisma.user.create({
      data: {
        name: "Store Administrator",
        email: "admin@example.com",
        passwordHash: "dummyhash",
        role: "ADMIN",
      },
    });

    customerToken = await generateTestToken(customerUser);
    adminToken = await generateTestToken(adminUser);

    testProduct = await testPrisma.product.create({
      data: {
        name: "Test Auth Keyboard",
        slug: "test-auth-keyboard",
        description: "A mechanical keyboard for authorization testing",
        price: 99.99,
        category: "Electronics",
        stock: 20,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await clearTestDatabase();
    await testPrisma.$disconnect();
  });

  describe("Product Creation Authorization", () => {
    const payload = {
      name: "New Ergonomic Mouse",
      description: "Comfortable ergonomic wireless vertical mouse",
      price: 69.99,
      category: "Electronics",
      stock: 50,
    };

    it("should reject unauthenticated product creation with 401 UNAUTHORIZED", async () => {
      const req = createMockRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: payload,
      });

      const res = await createProductHandler(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject CUSTOMER product creation with 403 FORBIDDEN", async () => {
      const req = createMockRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: payload,
        token: customerToken,
        tokenType: "cookie",
      });

      const res = await createProductHandler(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("should allow ADMIN product creation with 201 CREATED", async () => {
      const req = createMockRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: payload,
        token: adminToken,
        tokenType: "cookie",
      });

      const res = await createProductHandler(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.name).toBe(payload.name);
      expect(json.data.slug).toBe("new-ergonomic-mouse");
    });
  });

  describe("Product Update Authorization", () => {
    const updatePayload = {
      price: 119.99,
    };

    it("should reject unauthenticated product update with 401 UNAUTHORIZED", async () => {
      const req = createMockRequest(`http://localhost:3000/api/products/${testProduct.id}`, {
        method: "PATCH",
        body: updatePayload,
      });

      const res = await updateProductHandler(req, { params: { id: testProduct.id } });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject CUSTOMER product update with 403 FORBIDDEN", async () => {
      const req = createMockRequest(`http://localhost:3000/api/products/${testProduct.id}`, {
        method: "PATCH",
        body: updatePayload,
        token: customerToken,
        tokenType: "cookie",
      });

      const res = await updateProductHandler(req, { params: { id: testProduct.id } });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("should allow ADMIN product update with 200 OK", async () => {
      const req = createMockRequest(`http://localhost:3000/api/products/${testProduct.id}`, {
        method: "PATCH",
        body: updatePayload,
        token: adminToken,
        tokenType: "cookie",
      });

      const res = await updateProductHandler(req, { params: { id: testProduct.id } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.price).toBe(119.99);
    });
  });

  describe("Product Deletion Authorization", () => {
    it("should reject unauthenticated product deletion with 401 UNAUTHORIZED", async () => {
      const req = createMockRequest(`http://localhost:3000/api/products/${testProduct.id}`, {
        method: "DELETE",
      });

      const res = await deleteProductHandler(req, { params: { id: testProduct.id } });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject CUSTOMER product deletion with 403 FORBIDDEN", async () => {
      const req = createMockRequest(`http://localhost:3000/api/products/${testProduct.id}`, {
        method: "DELETE",
        token: customerToken,
        tokenType: "cookie",
      });

      const res = await deleteProductHandler(req, { params: { id: testProduct.id } });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("should allow ADMIN product deletion with 200 OK", async () => {
      const req = createMockRequest(`http://localhost:3000/api/products/${testProduct.id}`, {
        method: "DELETE",
        token: adminToken,
        tokenType: "cookie",
      });

      const res = await deleteProductHandler(req, { params: { id: testProduct.id } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      // Verify removed from database
      const dbCheck = await testPrisma.product.findUnique({
        where: { id: testProduct.id },
      });
      expect(dbCheck).toBeNull();
    });
  });
});
