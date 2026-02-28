Placeholder for parity and integration tests.

Recommended approach:
- Start Postgres service and run migrations.
- Seed with export/import.
- Use @trpc/client to call endpoints and compare with Convex outputs.
