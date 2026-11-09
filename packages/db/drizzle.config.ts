import { defineConfig } from 'drizzle-kit';

// Generate migrations with `pnpm db:generate` after editing src/schema.ts.
// Never hand-edit files in ./migrations.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://aifirst:aifirst@localhost:5432/aifirst',
  },
});
