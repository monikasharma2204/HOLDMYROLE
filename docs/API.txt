# E-Commerce REST API Documentation

This document contains the complete API contracts, security specifications, request/response models, and workflow examples for the E-Commerce assessment starter backend.

---

## 1. Authentication & Security Architecture

### Authentication Mechanisms

The API supports two authentication methods:

1. **HttpOnly Cookies (Browser Flow - Primary & Default)**:
   - Upon successful login (`POST /api/auth/login`), the server sets a cookie named `auth_token`.
   - **Cookie Attributes**:
     - `HttpOnly: true` (Prevents client-side JavaScript access via `document.cookie` to mitigate XSS attacks).
     - `Secure: true` in production (Transmitted strictly over HTTPS).
     - `SameSite: Lax` (Defends against cross-site request forgery while enabling top-level navigation).
     - `Path: /` (Valid across all API and application routes).
     - `Max-Age: 604800` (7 days expiration).
   - In frontend code using `fetch` or Axios, requests must include `credentials: "include"` (handled automatically by `lib/api/client.ts`).

2. **Authorization Bearer Header (API Clients & Automated Testing)**:
   - Supported for external tools (Postman, curl, backend test suites, mobile clients).
   - Header format: `Authorization: Bearer <jwt_token>`.
   - **Precedence**: The server checks for the `Authorization` header first. If absent, it inspects the `auth_token` cookie.

### CSRF Protection Strategy

- **Bearer Token Requests**: Immune to CSRF because web browsers never automatically attach custom `Authorization` headers across origins.
- **Cookie-Authenticated State-Changing Requests (`POST`, `PATCH`, `DELETE`)**:
  - The server verifies that the request `Origin` or `Referer` header matches the server's `Host` or `NEXT_PUBLIC_APP_URL`.
  - In addition, client requests include `X-Requested-With: XMLHttpRequest`, which browsers block in cross-origin requests unless explicitly permitted by CORS preflight headers.
  - If a cross-origin attempt is detected without authorization, the server rejects the request.

### Password Storage & Cryptography

- Passwords are encrypted with **Argon2id** (memory cost 19 MiB, 2 iterations, 1 parallelism lane).
- Plaintext passwords and password hashes are never stored in plain text and are never exposed in any API response or logs.

---

## 2. API Response Conventions

Every endpoint returns a standardized JSON structure.

### Standard Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Standard Paginated Success Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": {
      "price": ["Price must be greater than zero"]
    }
  }
}
```

### Common Error Codes

| Error Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | 400 | Request body or query parameters failed Zod schema validation. |
| `INVALID_JSON` | 400 | Request body could not be parsed as valid JSON. |
| `UNAUTHORIZED` | 401 | Missing, malformed, or expired authentication token. |
| `INVALID_CREDENTIALS` | 401 | Email not found or password does not match. |
| `FORBIDDEN` | 403 | User is authenticated but lacks required role (e.g. CUSTOMER accessing ADMIN routes). |
| `NOT_FOUND` | 404 | Resource with specified ID or slug was not found (or is inactive). |
| `CONFLICT` | 409 | Unique constraint violation (e.g. registering with an existing email). |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled server error. |

---

## 3. Endpoint Reference

---

### Authentication Endpoints

#### 1. Register Customer

- **Method**: `POST`
- **URL**: `/api/auth/register`
- **Auth**: Public
- **Role Required**: None (public registration always creates a `CUSTOMER`)

**Request Body**:
```json
{
  "name": "Jane Candidate",
  "email": "jane@example.com",
  "password": "Password123!"
}
```

**Validation Rules**:
- `name`: String, 2–100 characters, trimmed.
- `email`: Valid email format, normalized to lowercase, must be unique.
- `password`: String, 8–128 characters.

**Success Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "848e3cf7-ef4c-47ea-a2f0-e6962f9ebad1",
    "name": "Jane Candidate",
    "email": "jane@example.com",
    "role": "CUSTOMER",
    "createdAt": "2026-10-19T08:30:00.000Z",
    "updatedAt": "2026-10-19T08:30:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request` (`VALIDATION_ERROR`): Invalid email, name too short, or password under 8 characters.
- `409 Conflict` (`CONFLICT`): An account with this email address already exists.

---

#### 2. User Login

- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Auth**: Public
- **Role Required**: None

**Request Body**:
```json
{
  "email": "admin@store.dev",
  "password": "AdminPassword123!"
}
```

**Success Response (200 OK)**:
*Also sets HttpOnly `auth_token` cookie.*
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "9ea8e7cd-c887-453e-9753-02eec6f0a526",
      "name": "Store Administrator",
      "email": "admin@store.dev",
      "role": "ADMIN",
      "createdAt": "2026-10-19T08:30:00.000Z",
      "updatedAt": "2026-10-19T08:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

**Error Responses**:
- `400 Bad Request` (`VALIDATION_ERROR`): Missing email or password.
- `401 Unauthorized` (`INVALID_CREDENTIALS`): Invalid email or password.

---

#### 3. Current User Profile

- **Method**: `GET`
- **URL**: `/api/auth/me`
- **Auth**: Required (`auth_token` cookie or `Authorization: Bearer <token>`)
- **Role Required**: Any authenticated user (`CUSTOMER` or `ADMIN`)

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "9ea8e7cd-c887-453e-9753-02eec6f0a526",
      "name": "Store Administrator",
      "email": "admin@store.dev",
      "role": "ADMIN",
      "createdAt": "2026-10-19T08:30:00.000Z",
      "updatedAt": "2026-10-19T08:30:00.000Z"
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized` (`UNAUTHORIZED`): Session cookie or token is missing, expired, or invalid.

---

#### 4. User Logout

- **Method**: `POST`
- **URL**: `/api/auth/logout`
- **Auth**: Public / Any
- **Action**: Clears `auth_token` cookie by setting `Max-Age: 0`.

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out."
  }
}
```

---

### Product & Category Endpoints

#### 5. List & Filter Products

- **Method**: `GET`
- **URL**: `/api/products`
- **Auth**: Public
- **Visibility**: Excludes inactive products (`isActive: false`).

**Supported Query Parameters**:
| Parameter | Type | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `page` | integer | `1` | `>= 1` | Pagination page number |
| `limit` | integer | `10` | `1 – 50` | Number of items per page |
| `search` | string | `""` | Optional | Case-insensitive substring match on product name |
| `category` | string | `""` | Optional | Case-insensitive match on product category |
| `sortBy` | string | `createdAt` | `name`, `price`, `createdAt`, `stock` | Sorting field |
| `order` | string | `desc` | `asc` or `desc` | Sort order |

**Example Request**:
`GET /api/products?category=Audio&sortBy=price&order=asc&page=1&limit=5`

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "e8d356c9-216e-44ab-b34e-09028821a8bd",
      "name": "Studio Reference In-Ear Monitors",
      "slug": "studio-reference-in-ear-monitors",
      "description": "Triple-driver hybrid in-ear monitors tailored for audiophiles.",
      "price": 129.5,
      "category": "Audio",
      "imageUrl": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df",
      "stock": 60,
      "isActive": true,
      "createdAt": "2026-10-19T08:30:00.000Z",
      "updatedAt": "2026-10-19T08:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 3,
    "totalPages": 1
  }
}
```

**Error Responses**:
- `400 Bad Request` (`VALIDATION_ERROR`): Query parameter fails constraints (e.g., negative page, invalid sortBy).

---

#### 6. Get Product by UUID

- **Method**: `GET`
- **URL**: `/api/products/[id]`
- **Auth**: Public
- **Route Param**: `id` must be a valid UUID.

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "e8d356c9-216e-44ab-b34e-09028821a8bd",
    "name": "Studio Reference In-Ear Monitors",
    "slug": "studio-reference-in-ear-monitors",
    "description": "Triple-driver hybrid in-ear monitors tailored for audiophiles.",
    "price": 129.5,
    "category": "Audio",
    "imageUrl": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df",
    "stock": 60,
    "isActive": true,
    "createdAt": "2026-10-19T08:30:00.000Z",
    "updatedAt": "2026-10-19T08:30:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request` (`VALIDATION_ERROR`): Provided `id` is not a valid UUID format.
- `404 Not Found` (`NOT_FOUND`): Product does not exist or is inactive.

---

#### 7. Get Product by Slug

- **Method**: `GET`
- **URL**: `/api/products/slug/[slug]`
- **Auth**: Public
- **Route Param**: `slug` (URL-friendly string).

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "e8d356c9-216e-44ab-b34e-09028821a8bd",
    "name": "Studio Reference In-Ear Monitors",
    "slug": "studio-reference-in-ear-monitors",
    "description": "Triple-driver hybrid in-ear monitors tailored for audiophiles.",
    "price": 129.5,
    "category": "Audio",
    "imageUrl": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df",
    "stock": 60,
    "isActive": true,
    "createdAt": "2026-10-19T08:30:00.000Z",
    "updatedAt": "2026-10-19T08:30:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request` (`VALIDATION_ERROR`): Malformed slug format.
- `404 Not Found` (`NOT_FOUND`): Product not found or inactive.

---

#### 8. Create Product

- **Method**: `POST`
- **URL**: `/api/products`
- **Auth**: Required
- **Role Required**: `ADMIN` (Forbidden for `CUSTOMER`)

**Request Body**:
```json
{
  "name": "Wireless Mechanical Numpad",
  "description": "21-key hot-swappable Bluetooth mechanical numeric keypad.",
  "price": 49.99,
  "category": "Electronics",
  "stock": 40,
  "imageUrl": "https://example.com/numpad.jpg",
  "isActive": true
}
```

**Validation Rules**:
- `name`: 2–150 characters, trimmed. Automatically converted to unique slug.
- `description`: 5–5000 characters.
- `price`: Positive number, up to 1,000,000.
- `category`: 2–50 characters.
- `stock`: Non-negative integer.
- `imageUrl`: Optional valid URL or null.
- `isActive`: Optional boolean (default `true`).

**Success Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "41c6f9b8-a73e-4fa2-b258-20d00fbe224a",
    "name": "Wireless Mechanical Numpad",
    "slug": "wireless-mechanical-numpad",
    "description": "21-key hot-swappable Bluetooth mechanical numeric keypad.",
    "price": 49.99,
    "category": "Electronics",
    "imageUrl": "https://example.com/numpad.jpg",
    "stock": 40,
    "isActive": true,
    "createdAt": "2026-10-19T08:35:00.000Z",
    "updatedAt": "2026-10-19T08:35:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request` (`VALIDATION_ERROR`): Field validation failure.
- `401 Unauthorized` (`UNAUTHORIZED`): Missing or invalid authentication token.
- `403 Forbidden` (`FORBIDDEN`): Authenticated user has role `CUSTOMER`.

---

#### 9. Update Product

- **Method**: `PATCH`
- **URL**: `/api/products/[id]`
- **Auth**: Required
- **Role Required**: `ADMIN`

**Request Body (Partial Update)**:
```json
{
  "price": 44.99,
  "stock": 75
}
```

**Slug Regeneration Policy**:
If `name` is changed in the update payload, a new unique slug is generated automatically.

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "41c6f9b8-a73e-4fa2-b258-20d00fbe224a",
    "name": "Wireless Mechanical Numpad",
    "slug": "wireless-mechanical-numpad",
    "description": "21-key hot-swappable Bluetooth mechanical numeric keypad.",
    "price": 44.99,
    "category": "Electronics",
    "imageUrl": "https://example.com/numpad.jpg",
    "stock": 75,
    "isActive": true,
    "createdAt": "2026-10-19T08:35:00.000Z",
    "updatedAt": "2026-10-19T08:40:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request` (`VALIDATION_ERROR`): Invalid UUID, invalid fields, or empty update payload `{}`.
- `401 Unauthorized` (`UNAUTHORIZED`): Unauthenticated.
- `403 Forbidden` (`FORBIDDEN`): Not an administrator.
- `404 Not Found` (`NOT_FOUND`): Target product ID does not exist.

---

#### 10. Delete Product

- **Method**: `DELETE`
- **URL**: `/api/products/[id]`
- **Auth**: Required
- **Role Required**: `ADMIN`

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "Product 'Wireless Mechanical Numpad' has been successfully deleted."
  }
}
```

**Error Responses**:
- `400 Bad Request` (`VALIDATION_ERROR`): Invalid UUID format.
- `401 Unauthorized` (`UNAUTHORIZED`): Unauthenticated.
- `403 Forbidden` (`FORBIDDEN`): Role is not ADMIN.
- `404 Not Found` (`NOT_FOUND`): Target product does not exist.

---

#### 11. List Categories

- **Method**: `GET`
- **URL**: `/api/categories`
- **Auth**: Public
- **Description**: Returns sorted distinct categories present in active products.

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    "Accessories",
    "Audio",
    "Electronics",
    "Office"
  ]
}
```

---

## 4. End-to-End Workflow Examples

### Workflow 1: Customer Registration
```bash
curl -i -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Candidate",
    "email": "alex@example.com",
    "password": "AlexPassword123!"
  }'
```

### Workflow 2: Login (Browser Cookie Flow)
```bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@store.dev",
    "password": "AdminPassword123!"
  }'
```

### Workflow 3: Retrieve Current Profile
```bash
curl -i -b cookies.txt http://localhost:3000/api/auth/me
```

### Workflow 4: Listing & Filtering Products
```bash
# Filter Audio category, price ascending, page 1 with 4 items
curl -i "http://localhost:3000/api/products?category=Audio&sortBy=price&order=asc&page=1&limit=4"
```

### Workflow 5: Fetch Product by ID or Slug
```bash
# By slug:
curl -i http://localhost:3000/api/products/slug/acoustic-pro-wireless-headphones

# By ID:
curl -i http://localhost:3000/api/products/<PRODUCT_UUID>
```

### Workflow 6: Create Product as Admin
```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "name": "Ergonomic Split Keyboard",
    "description": "Ergonomic split layout mechanical keyboard.",
    "price": 189.99,
    "category": "Electronics",
    "stock": 25
  }'
```

### Workflow 7: Update Product
```bash
curl -i -b cookies.txt -X PATCH http://localhost:3000/api/products/<PRODUCT_UUID> \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "price": 174.99,
    "stock": 30
  }'
```

### Workflow 8: Delete Product
```bash
curl -i -b cookies.txt -X DELETE http://localhost:3000/api/products/<PRODUCT_UUID> \
  -H "Origin: http://localhost:3000"
```

### Workflow 9: Attempt Administrative Operation as Customer (Forbidden)
```bash
# Login as Customer
curl -s -c customer_cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"CustomerPassword123!"}' > /dev/null

# Attempt product creation (Expect 403 Forbidden)
curl -i -b customer_cookies.txt -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"name":"Unauthorized Product","description":"Test","price":10,"category":"Test","stock":1}'
```

### Workflow 10: Logout & Verification of Protected Access Rejection
```bash
# Logout clears cookie
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/auth/logout

# Subsequent profile fetch returns 401
curl -i -b cookies.txt http://localhost:3000/api/auth/me
```
