# Inloom Backend

A scalable multi-tenant e-commerce backend built with TypeScript, Node.js, Express 5, Apollo Server 5, and Prisma (PostgreSQL). Supports shop (customer), seller (vendor), and admin (platform) GraphQL APIs with robust role-based access control.

## Features

- **Three GraphQL endpoints**: `/graphql/shop`, `/graphql/seller`, `/graphql/admin` (separate schemas, contexts, and auth)
- **Prisma ORM**: PostgreSQL data layer, single Prisma client instance
- **Role-based JWT authentication**: Shop (optional), Seller (required), Admin (required)
- **Rich domain models**: Users, sellers, products, variants, orders, payments, reviews, etc.
- **Pagination, field resolvers, and eager relations**
- **Modern ESM TypeScript**: Node ESM imports, strict typing
- **Logging**: Pino with pretty transport
- **Health check endpoint**: `/health`

## Project Structure

```
prisma/           # Prisma schema, migrations, seed
src/
  index.ts        # Entrypoint
  server.ts       # Express + Apollo server setup
  config/         # Database config
  graphql/
    shop/         # Shop API (schema, resolvers, context)
    seller/       # Seller API (schema, resolvers, context)
    admin/        # Admin API (schema, resolvers, context)
    shared/       # Shared GraphQL types
  middleware/     # Auth utilities
  types/          # Context types
  utils/          # Logger
```

## Getting Started

### Prerequisites

- Node.js >= 18
- Yarn (preferred) or npm
- PostgreSQL database

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/ghoshzsh/inloom-backend.git
   cd inloom-backend
   ```
2. **Install dependencies**
   ```bash
   yarn install
   # or
   npm install
   ```
3. **Configure environment**

   - Copy `.env.example` to `.env` and set:
     - `DATABASE_URL` (PostgreSQL connection string)
     - `JWT_SECRET` (JWT signing key)
     - `ALLOWED_ORIGINS` (CSV for CORS)
     - `PORT` (optional, default 4000)

4. **Run Prisma migrations & seed**

   ```bash
   npx prisma migrate dev --name as-you-wish
   npx prisma generate
   npx db:seed

   # Other useful commands
   npx prisma migrate reset
   ```

5. **Start the server**

   - Development: `yarn dev`
   - Production: `yarn start`

6. **Access GraphQL endpoints**
   - Shop: `http://localhost:4000/graphql/shop`
   - Seller: `http://localhost:4000/graphql/seller`
   - Admin: `http://localhost:4000/graphql/admin`
   - Health: `http://localhost:4000/health`

## Authentication

- **Shop**: JWT optional; attach user if present
- **Seller**: JWT required, role must be `SELLER`
- **Admin**: JWT required, role must be `ADMIN`
- Send `Authorization: Bearer <jwt>` header for protected endpoints

## Development Scripts

- `yarn dev` — Start dev server (tsx watch)
- `yarn compile` — Compile TypeScript to `dist/`
- `yarn start` — Run compiled server
- `yarn db:seed` — Seed database

## Prisma Workflow

- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`
- Seed: `prisma/seed.ts`
- Use `context.prisma` in resolvers (never import Prisma directly)

## Contributing

1. Fork the repo
2. Create a feature branch
3. Commit changes
4. Open a pull request

## License

MIT

---

For architecture, patterns, and troubleshooting, see `.github/copilot-instructions.md`.
