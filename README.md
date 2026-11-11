# LCM - Loving Care-Home Management System

LCM is an enterprise-grade, multi-tenant management system designed for care homes. It provides a comprehensive suite of tools for resident management, staff scheduling, role-based access control (RBAC), and facility configuration, built with performance, security, and compliance in mind.

## 🏗️ Architecture Overview

This project is a monorepo powered by **Turborepo**, utilizing a modern full-stack TypeScript ecosystem.

### Project Structure

```text
├── apps/
│   ├── web/                # Main Care-Home portal (Next.js + TanStack Query)
│   ├── backend/            # Primary API Gateway (NestJS + Prisma)
│   ├── superadmin/         # Platform management portal (Next.js)
│   └── docs/               # Technical documentation
├── packages/
│   ├── db/                 # Database package (Prisma schema, Migrations, Seed)
│   ├── schema/             # Shared Zod schemas and TypeScript types
│   ├── ui/                 # Shared UI component library (TailwindCSS + Radix UI)
│   ├── typescript-config/  # Shared TS configurations
│   └── eslint-config/      # Shared ESLint configurations
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20 or later
- **pnpm**: v9 or later (recommended package manager)
- **PostgreSQL**: A running instance of PostgreSQL

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd care-home
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Environment Configuration

Each application/package requires its own `.env` file. You can find example structures in the respective directories:

- `apps/backend/.env`
- `packages/db/.env`
- `apps/web/.env`

**Essential Variable:**
Ensure `DATABASE_URL` is correctly set in `packages/db/.env` and `apps/backend/.env`.

## 🗄️ Database Management

The project uses Prisma ORM. Follow these steps to initialize your database:

1. **Generate Prisma Client**:

   ```bash
   pnpm db:generate
   ```

2. **Push Schema to Database**:

   ```bash
   pnpm db:push
   ```

3. **Seed Initial Data**:
   Populate roles, subscription packages, and default admin users:
   ```bash
   pnpm db:seed
   ```
   _Default Admin:_ `admin@platform.com` / `Password123!`

## 💻 Running the Project

To start all applications in development mode simultaneously:

```bash
pnpm dev
```

This will launch:

- **Backend**: `http://localhost:4400` (Swagger UI at `/api`)
- **Web Portal**: `http://localhost:3000`
- **SuperAdmin**: `http://localhost:3002`

### Individual Application Commands

- **Run Web only**: `pnpm dev --filter web`
- **Run Backend only**: `pnpm dev --filter backend`
- **Build all**: `pnpm build`

## 🛠️ Core Modules

- **Resident Management**: Admission, profile tracking, and care plans.
- **Staff Management**: Directory, roles, and shift assignments.
- **Role Management**: Granular RBAC system with system-wide and tenant-specific rules.
- **Facility Management**: Configuration of wings, units, rooms, and beds.
- **Auth & Security**: JWT-based auth with Refresh Token rotation and mandatory TOTP MFA.

## 📜 Coding Standards

All contributions must adhere to the standards outlined in [`AGENTS.md`](./AGENTS.md) (rules of engagement) and [`PROJECT.md`](./PROJECT.md) (authoritative project facts). The cleanup backlog is tracked in [`Refactor.md`](./Refactor.md). Key highlights:

- **Strict TypeScript**: No `any` types.
- **Performance**: Hydration/Dehydration patterns for TanStack Query.
- **Security**: Tenant isolation at the database level and secure cookie handling.
- **Modular UI**: Components must use `@repo/ui` primitives.

---

**Version**: 1.0.0  
**License**: Private / Proprietary