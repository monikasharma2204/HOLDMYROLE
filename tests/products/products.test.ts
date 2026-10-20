import { describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  GET as listProductsHandler,
  POST as createProductHandler,
} from "@/app/api/products/route";
import {
  GET as getProductByIdHandler,
  PATCH as updateProductHandler,
  DELETE as deleteProductHandler,
} from "@/app/api/products/[id]/route";
import { GET as getProductBySlugHandler } from "@/app/api/products/slug/[slug]/route";
import { GET as listCategoriesHandler } from "@/app/api/categories/route";
import {
  generateTestToken,
  createMockRequest,
  clearTestDatabase,
  testPrisma,
} from "../helpers";

describe("Products API Endpoints", () => {
  let adminToken: string;
  let activeProduct1: any;
  let activeProduct2: any;
  let activeProduct3: any;
  let inactiveProduct: any;

  beforeEach(async () => {
    await clearTestDatabase();

    const adminUser = await testPrisma.user.create({
      data: {
        name: "Inventory Admin",
        email: "inventory.admin@example.com",
        passwordHash: "dummyhash",
        role: "ADMIN",
      },
    });
    adminToken = await generateTestToken(adminUser);

    // Create baseline test products across categories
    activeProduct1 = await testPrisma.product.create({
      data: {
        name: "Wireless Studio Headphones",
        slug: "wireless-studio-headphones",
        description: "Studio grade wireless headphones with high impedance drivers",
        price: 299.99,
        category: "Audio",
        stock: 15,
        isActive: true,
      },
    });

    activeProduct2 = await testPrisma.product.create({
      data: {
        name: "Mechanical Gaming Keyboard",
        slug: "mechanical-gaming-keyboard",
        description: "Custom mechanical keyboard with lubricated switches",
        price: 149.50,
        category: "Electronics",
        stock: 30,
        isActive: true,
      },
    });

    activeProduct3 = await testPrisma.product.create({
      data: {
        name: "Ultra Precision Mouse",
        slug: "ultra-precision-mouse",
        description: "Lightweight mouse with braided cable",
        price: 79.99,
        category: "Electronics",
        stock: 50,
        isActive: true,
      },
    });

    inactiveProduct = await testPrisma.product.create({
      data: {
        name: "Discontinued Prototype Display",
        slug: "discontinued-prototype-display",
        description: "Old prototype not for public sale",
        price: 899.00,
        category: "Electronics",
        stock: 0,
        isActive: false, // Inactive
      },
    });
  });

  afterAll(async () => {
    await clearTestDatabase();
    await testPrisma.$disconnect();
  });

  describe("GET /api/products", () => {
    it("should list active products with correct pagination metadata", async () => {
      const req = createMockRequest("http://localhost:3000/api/products?page=1&limit=2");
      const res = await listProductsHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBe(2);
      expect(json.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 3, // only 3 active products, inactive is excluded!
        totalPages: 2,
      });
    });

    it("should filter products by search term (case-insensitive)", async () => {
      const req = createMockRequest("http://localhost:3000/api/products?search=headphones");
      const res = await listProductsHandler(req);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.data.length).toBe(1);
      expect(json.data[0].name).toBe("Wireless Studio Headphones");
    });

    it("should filter products by category", async () => {
      const req = createMockRequest("http://localhost:3000/api/products?category=Audio");
      const res = await listProductsHandler(req);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.data.length).toBe(1);
      expect(json.data[0].category).toBe("Audio");
    });

    it("should sort products by price ascending", async () => {
      const req = createMockRequest("http://localhost:3000/api/products?sortBy=price&order=asc");
      const res = await listProductsHandler(req);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.data[0].price).toBe(79.99);
      expect(json.data[1].price).toBe(149.50);
      expect(json.data[2].price).toBe(299.99);
    });

    it("should sort products by price descending", async () => {
      const req = createMockRequest("http://localhost:3000/api/products?sortBy=price&order=desc");
      const res = await listProductsHandler(req);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.data[0].price).toBe(299.99);
      expect(json.data[1].price).toBe(149.50);
      expect(json.data[2].price).toBe(79.99);
    });

    it("should exclude inactive products from public list", async () => {
      const req = createMockRequest("http://localhost:3000/api/products?limit=50");
      const res = await listProductsHandler(req);
      const json = await res.json();

      const slugs = json.data.map((p: any) => p.slug);
      expect(slugs).not.toContain("discontinued-prototype-display");
    });

    it("should reject invalid query parameters with 400 VALIDATION_ERROR", async () => {
      const req = createMockRequest("http://localhost:3000/api/products?page=-1&sortBy=invalidField");
      const res = await listProductsHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/products/[id]", () => {
    it("should return active product by UUID", async () => {
      const req = createMockRequest(`http://localhost:3000/api/products/${activeProduct1.id}`);
      const res = await getProductByIdHandler(req, { params: { id: activeProduct1.id } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(activeProduct1.id);
      expect(json.data.name).toBe("Wireless Studio Headphones");
      expect(json.data.price).toBe(299.99);
    });

    it("should return 404 NOT_FOUND for inactive product", async () => {
      const req = createMockRequest(`http://localhost:3000/api/products/${inactiveProduct.id}`);
      const res = await getProductByIdHandler(req, { params: { id: inactiveProduct.id } });
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("should return 404 NOT_FOUND for nonexistent product UUID", async () => {
      const nonexistentId = "00000000-0000-0000-0000-000000000000";
      const req = createMockRequest(`http://localhost:3000/api/products/${nonexistentId}`);
      const res = await getProductByIdHandler(req, { params: { id: nonexistentId } });
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("should return 400 VALIDATION_ERROR for invalid UUID format", async () => {
      const req = createMockRequest("http://localhost:3000/api/products/not-a-valid-uuid");
      const res = await getProductByIdHandler(req, { params: { id: "not-a-valid-uuid" } });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/products/slug/[slug]", () => {
    it("should return active product by slug", async () => {
      const req = createMockRequest("http://localhost:3000/api/products/slug/wireless-studio-headphones");
      const res = await getProductBySlugHandler(req, { params: { slug: "wireless-studio-headphones" } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.slug).toBe("wireless-studio-headphones");
    });

    it("should return 404 NOT_FOUND for inactive product slug", async () => {
      const req = createMockRequest("http://localhost:3000/api/products/slug/discontinued-prototype-display");
      const res = await getProductBySlugHandler(req, { params: { slug: "discontinued-prototype-display" } });
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("should return 404 NOT_FOUND for unknown slug", async () => {
      const req = createMockRequest("http://localhost:3000/api/products/slug/unknown-product-slug");
      const res = await getProductBySlugHandler(req, { params: { slug: "unknown-product-slug" } });
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("NOT_FOUND");
    });
  });

  describe("POST /api/products - Creation, Validation & Duplicate Slug Handling", () => {
    it("should create product and generate URL-friendly slug", async () => {
      const req = createMockRequest("http://localhost:3000/api/products", {
        method: "POST",
        token: adminToken,
        tokenType: "bearer",
        body: {
          name: "Smart Ambient Lamp",
          description: "RGB smart LED ambient light with voice assistant integration",
          price: 49.99,
          category: "Home",
          stock: 100,
        },
      });

      const res = await createProductHandler(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.slug).toBe("smart-ambient-lamp");
      expect(json.data.price).toBe(49.99);
      expect(json.data.stock).toBe(100);
    });

    it("should resolve slug collision when creating product with duplicate name", async () => {
      // Create first product
      const req1 = createMockRequest("http://localhost:3000/api/products", {
        method: "POST",
        token: adminToken,
        tokenType: "bearer",
        body: {
          name: "Portable Bluetooth Speaker",
          description: "Compact waterproof speaker",
          price: 59.99,
          category: "Audio",
          stock: 25,
        },
      });
      const res1 = await createProductHandler(req1);
      const json1 = await res1.json();
      expect(json1.data.slug).toBe("portable-bluetooth-speaker");

      // Create second product with identical name
      const req2 = createMockRequest("http://localhost:3000/api/products", {
        method: "POST",
        token: adminToken,
        tokenType: "bearer",
        body: {
          name: "Portable Bluetooth Speaker",
          description: "Second edition of compact speaker",
          price: 69.99,
          category: "Audio",
          stock: 35,
        },
      });
      const res2 = await createProductHandler(req2);
      const json2 = await res2.json();
      expect(json2.data.slug).toBe("portable-bluetooth-speaker-1");
    });

    it("should reject product creation with invalid data", async () => {
      const req = createMockRequest("http://localhost:3000/api/products", {
        method: "POST",
        token: adminToken,
        tokenType: "bearer",
        body: {
          name: "", // empty
          description: "x", // too short
          price: -10, // negative price
          category: "", // empty
          stock: -5, // negative stock
          imageUrl: "invalid-url",
        },
      });

      const res = await createProductHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.details.name).toBeDefined();
      expect(json.error.details.price).toBeDefined();
      expect(json.error.details.stock).toBeDefined();
      expect(json.error.details.imageUrl).toBeDefined();
    });
  });

  describe("PATCH /api/products/[id] - Updates and Slug Regeneration", () => {
    it("should partially update fields without affecting other fields", async () => {
      const req = createMockRequest(`http://localhost:3000/api/products/${activeProduct1.id}`, {
        method: "PATCH",
        token: adminToken,
        tokenType: "bearer",
        body: {
          price: 349.99,
          stock: 42,
        },
      });

      const res = await updateProductHandler(req, { params: { id: activeProduct1.id } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.price).toBe(349.99);
      expect(json.data.stock).toBe(42);
      // Untouched fields remain intact
      expect(json.data.name).toBe(activeProduct1.name);
      expect(json.data.slug).toBe(activeProduct1.slug);
    });

    it("should regenerate slug when product name is updated", async () => {
      const req = createMockRequest(`http://localhost:3000/api/products/${activeProduct1.id}`, {
        method: "PATCH",
        token: adminToken,
        tokenType: "bearer",
        body: {
          name: "Wireless Studio Pro Headphones MKII",
        },
      });

      const res = await updateProductHandler(req, { params: { id: activeProduct1.id } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.slug).toBe("wireless-studio-pro-headphones-mkii");
    });

    it("should reject empty update payload with 400 VALIDATION_ERROR", async () => {
      const req = createMockRequest(`http://localhost:3000/api/products/${activeProduct1.id}`, {
        method: "PATCH",
        token: adminToken,
        tokenType: "bearer",
        body: {},
      });

      const res = await updateProductHandler(req, { params: { id: activeProduct1.id } });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 404 NOT_FOUND for update on nonexistent product", async () => {
      const nonexistentId = "00000000-0000-0000-0000-000000000000";
      const req = createMockRequest(`http://localhost:3000/api/products/${nonexistentId}`, {
        method: "PATCH",
        token: adminToken,
        tokenType: "bearer",
        body: { price: 99.00 },
      });

      const res = await updateProductHandler(req, { params: { id: nonexistentId } });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/products/[id]", () => {
    it("should delete product and prevent it from appearing in public endpoints", async () => {
      const req = createMockRequest(`http://localhost:3000/api/products/${activeProduct2.id}`, {
        method: "DELETE",
        token: adminToken,
        tokenType: "bearer",
      });

      const res = await deleteProductHandler(req, { params: { id: activeProduct2.id } });
      expect(res.status).toBe(200);

      // Verify 404 when querying by ID afterwards
      const getReq = createMockRequest(`http://localhost:3000/api/products/${activeProduct2.id}`);
      const getRes = await getProductByIdHandler(getReq, { params: { id: activeProduct2.id } });
      expect(getRes.status).toBe(404);
    });

    it("should return 404 NOT_FOUND when attempting to delete nonexistent product", async () => {
      const nonexistentId = "00000000-0000-0000-0000-000000000000";
      const req = createMockRequest(`http://localhost:3000/api/products/${nonexistentId}`, {
        method: "DELETE",
        token: adminToken,
        tokenType: "bearer",
      });

      const res = await deleteProductHandler(req, { params: { id: nonexistentId } });
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/categories", () => {
    it("should return distinct categories of active products only", async () => {
      const req = createMockRequest("http://localhost:3000/api/categories");
      const res = await listCategoriesHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data).toContain("Audio");
      expect(json.data).toContain("Electronics");
    });
  });
});
