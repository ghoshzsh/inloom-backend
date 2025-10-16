## Copilot instructions for inloom-backend

This repo is a TypeScript Node.js backend using Express 5, Apollo Server 5, and Prisma (PostgreSQL). It exposes three GraphQL endpoints with separate schemas and contexts: shop (customers), seller (vendors), and admin (platform admins).

### Architecture and flow

- Entrypoint: `src/index.ts` loads env, then `startServer()` from `src/server.ts`.
- Server setup: `src/server.ts` mounts three Apollo servers at `/graphql/shop`, `/graphql/seller`, `/graphql/admin`, plus `/health`.
- GraphQL modules live under `src/graphql/{shop|seller|admin}` with:
  - `schema.ts` (SDL string), `resolvers/{query.ts, mutation.ts, index.ts}`, and `context.ts` per domain.
  - Re-exports via `index.ts` (e.g., `export { shopTypeDefs } from './schema.js'`).
- Data layer: Prisma client instantiated once in `src/config/database.ts` and passed to resolvers via context. Do not import Prisma directly inside resolvers—use `context.prisma`.

### Runtime and build conventions

- ESM everywhere: `package.json` has `"type": "module"`. In TS source, import with `.js` extensions (e.g., `import { startServer } from './server.js'`) to match Node ESM resolution after compile.
- Scripts:
  - Dev: `yarn dev` (tsx watch `src/index.ts`).
  - Build: `yarn compile` (tsc to `dist/`).
  - Start: `yarn start` (compile then run `dist/src/index.js`).
  - Seed: `yarn db:seed` runs `prisma/seed.ts` via tsx.
- TypeScript config: `tsconfig.json` targets ES2023, `module: esnext`, `outDir: dist`.

### Environment variables (required/common)

- `DATABASE_URL` (PostgreSQL connection for Prisma).
- `JWT_SECRET` (JWT signing/verification; defaults to a dev value if unset).
- `ALLOWED_ORIGINS` (CSV; used by CORS in `server.ts`; falls back to `*`).
- `PORT` (optional; default 4000) and `NODE_ENV`.

### Auth and context

- JWT utilities in `src/middleware/auth.ts`: `extractToken(req)`, `verifyToken(token)`, `generateToken(payload)`.
- Context creators enforce role-based access:
  - Shop: `createShopContext` allows anonymous; attaches `user` if token valid.
  - Seller: `createSellerContext` requires `role === 'SELLER'`; loads `sellerProfileId`.
  - Admin: `createAdminContext` requires `role === 'ADMIN'`.
- Pattern: throw `GraphQLError` with `extensions.code` (`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_USER_INPUT`). See usages in resolvers.

### GraphQL patterns to follow

- SDL lives as a single template string per domain (`schema.ts`). Keep enums aligned with Prisma enums.
- Resolvers are split by operation type; `resolvers/index.ts` composes `{ Query, Mutation, ...fieldResolvers, DateTime, JSON }` using `graphql-scalars`.
- Pagination: queries commonly accept `limit`/`offset` and return a Connection shape `{ edges, pageInfo, totalCount }`. Cursors are simple IDs (not true cursor-based).
- Field resolvers compute derived data like `averageRating`, `reviewCount`, and `totalSold` (aggregate via Prisma).
- Include relations eagerly where needed with Prisma `include` blocks (see product, order queries).

### Prisma usage

- Schema: `prisma/schema.prisma` defines users, sellers, products, variants, orders, payments, reviews, etc., with enum statuses.
- Access Prisma via `context.prisma` passed into resolvers. Only `server.ts` handles lifecycle/shutdown.
- Example low stock filter uses Prisma typed fields: `stockQuantity: { lte: prisma.product.fields.lowStockThreshold }`.

### Adding features safely (examples)

- New query/mutation:
  1. Update SDL in `src/graphql/<domain>/schema.ts`.
  2. Implement in `resolvers/query.ts` or `resolvers/mutation.ts` using `context.prisma` and GraphQLError codes.
  3. Export via `resolvers/index.ts`.
- Guard by role: use the domain context. For cross-domain checks, prefer explicit GraphQLErrors over silent nulls.

### Local run checklist

- Ensure DB is up and `DATABASE_URL` is set; then run Prisma generate/migrate as needed.
- Dev server: `yarn dev` then visit `/graphql/{shop|seller|admin}` and `/health`.
- For authenticated calls, send `Authorization: Bearer <jwt>`.

### Notes

- Logging uses `pino` (pretty transport). Prefer the shared logger from `src/utils/logger.ts` for new modules.
- CORS is per-endpoint; update `ALLOWED_ORIGINS` for frontends.

If any of the above is unclear (e.g., preferred package manager vs npm, Prisma migrate workflow, or seeding expectations), reply with the gaps and I’ll refine these instructions.
