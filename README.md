# E-Commerce API Backend & Assessment Starter

A production-grade, fully functional e-commerce starter repository designed to assess frontend engineering interns.

This repository provides an operational backend, database schema, automated test suite, complete API documentation, and a minimal development shell. Intern candidates use this foundation to design and implement their own frontend user interface.

---

## 1. Technology Stack

- **Framework**: Next.js 14 with App Router and TypeScript
- **Backend**: Next.js Route Handlers (`app/api/*`)
- **Database**: PostgreSQL
- **ORM**: Prisma ORM with typed migrations
- **Authentication**: JWT with secure `HttpOnly` browser cookies and Argon2id password hashing
- **Validation**: Zod for request body and query parameter validation
- **Testing**: Vitest with isolated PostgreSQL test database
- **Styling**: Tailwind CSS (used only for the minimal development shell)
- **Containerization**: Docker Compose for local PostgreSQL

---

## 2. Project Architecture

```
app/
  api/
    auth/
      register/route.ts       # POST /api/auth/register (Customer registration)
      login/route.ts          # POST /api/auth/login (JWT & HttpOnly cookie)
      me/route.ts             # GET /api/auth/me (Current user profile)
      logout/route.ts         # POST /api/auth/logout (Clears cookie)
    products/
      route.ts                # GET /api/products, POST /api/products (Admin)
      [id]/route.ts           # GET, PATCH, DELETE /api/products/[id]
      slug/
        [slug]/route.ts       # GET /api/products/slug/[slug]
    categories/route.ts       # GET /api/categories (Distinct active categories)
  login/page.tsx              # Starter authentication shell
  products/page.tsx           # Starter products catalogue shell
  products/[slug]/page.tsx    # Dynamic product detail route
  admin/products/page.tsx     # Admin inventory table shell
  admin/products/new/page.tsx # Admin create product shell
  admin/products/[id]/edit/   # Admin edit product shell
  layout.tsx
  page.tsx                    # Assessment candidate overview & instructions

components/
  layout/
    Navbar.tsx                # Development shell navigation

lib/
  api/
    client.ts                 # Reusable frontend API client with cookie handling
    request.ts                # Body validation & JSON parsing helpers
    response.ts               # Standardized success & error response utilities
  auth/
    jwt.ts                    # Jose JWT signing & cryptographic verification
    guards.ts                 # Role-based authorization guards (requireAuth, requireAdmin)
    password.ts               # Argon2id password hashing & verification
    session.ts                # Request session resolver & CSRF validation
  db/
    prisma.ts                 # Global PrismaClient singleton
  utils/
    format.ts                 # Decimal price to number serializer
    slug.ts                   # URL slug generator & collision resolver

prisma/
  schema.prisma               # User & Product PostgreSQL models
  seed.ts                     # Database seeder (Admin, Customer, 14 products)

tests/
  auth/                       # Registration, login, JWT verification tests
  products/                   # Authorization & Product CRUD tests
  helpers.ts                  # Test request creator & DB setup utilities

docs/
  API.md                      # Complete API endpoint reference & workflows
  FRONTEND_ASSIGNMENT.md      # Intern assessment guide & grading rubric
  postman_collection.json     # Importable Postman v2.1 collection
```

---

## 3. Quickstart & Local Setup

### Step 1: Clone and Install Dependencies

```bash
git clone <repository-url>
cd ecommerce-starter
npm install
```

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure the configuration matches your local database:

```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/ecommerce_dev?schema=public"
JWT_SECRET="replace-with-a-secure-random-secret-at-least-32-characters"
ADMIN_EMAIL="admin@store.dev"
ADMIN_PASSWORD="AdminPassword123!"
NODE_ENV="development"
PORT=3000
NEXT_PUBLIC_APP_URL="http://localhost:3000"
COOKIE_NAME="auth_token"
```

### Step 3: Start PostgreSQL

**Option A: Using Docker Compose (Recommended)**
```bash
docker compose up -d
```

**Option B: Using Local PostgreSQL**
Ensure PostgreSQL is running locally, then create the databases:
```bash
psql -U postgres -c "CREATE DATABASE ecommerce_dev;"
psql -U postgres -c "CREATE DATABASE ecommerce_test;"
```

### Step 4: Run Migrations and Seed Database

```bash
# Run Prisma migrations
npm run db:migrate

# Seed sample catalogue and default users
npm run db:seed
```

### Step 5: Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the development starter shell.

---

## 4. Test Credentials

The database seeder creates two pre-configured accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@store.dev` | `AdminPassword123!` | Public access + Product creation, editing, and deletion |
| **Customer** | `customer@example.com` | `CustomerPassword123!` | Public product reading, forbidden from admin mutations |

---

## 5. Automated Tests

Automated tests are written with Vitest and execute against an isolated test database (`.env.test`).

To run the complete test suite:

```bash
npm test
```

To run in watch mode during development:
```bash
npm run test:watch
```

---

## 6. Production Verification

Verify that TypeScript and linting pass and build the optimized production bundle:

```bash
# Run ESLint checks
npm run lint

# Run Next.js production build
npm run build

# Start the production server
npm run start
```

---

## 7. Documentation & Resources

- 📘 [API Reference & Contracts](docs/API.txt): Detailed documentation of all endpoints, request bodies, query parameters, status codes, and security.
- 📋 [Frontend Assessment Instructions](docs/FRONTEND_ASSIGNMENT.txt): Complete candidate guidelines, user stories, and grading rubric.
- 📮 [Postman Collection](docs/postman_collection.json): Importable collection with ready-to-test requests.
- 💻 [Frontend API Client](lib/api/client.ts): Reusable, typed client for candidates.
