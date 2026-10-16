<p align="center">
  <img src="public/logo192.png" alt="KouKou logo" width="96" height="96" />
</p>

<h1 align="center">KouKou 扣扣帳本</h1>

<p align="center">
  <img src="https://img.shields.io/badge/node-%5E20.19%20%7C%20%5E22.12%20%7C%20%3E%3D24-5FA04E?logo=nodedotjs&logoColor=white" alt="Node.js ^20.19 | ^22.12 | >=24" />
  <img src="https://img.shields.io/badge/npm-%3E%3D11-CB3837?logo=npm&logoColor=white" alt="npm >=11" />
  <img src="https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql&logoColor=white" alt="MySQL 8.x" />
</p>

KouKou is a small web app for keeping track of recurring payments — memberships, phone bills, insurance and anything else that is charged automatically — so you can see what gets charged, when, and from which card or account, all in one place.

## Getting started

1. **Set up the database**

   Create a database and a user for the app (adjust the name and password as needed):

   ```sql
   CREATE DATABASE koukou CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'koukou'@'localhost' IDENTIFIED BY 'change-me';
   GRANT ALL PRIVILEGES ON koukou.* TO 'koukou'@'localhost';

   -- Development only: `npm run db:migrate` creates a temporary "shadow" database,
   -- so the user must be allowed to create and drop databases.
   GRANT CREATE, ALTER, DROP, INDEX, REFERENCES ON *.* TO 'koukou'@'localhost';

   FLUSH PRIVILEGES;
   ```

   Production only runs `migrate deploy`, so the development-only grant is not needed there.

   Then point the app at the database:

   ```bash
   cp .env.example .env
   ```

   and set `DATABASE_URL` in `.env`, e.g. `mysql://koukou:change-me@localhost:3306/koukou`.

2. **Install dependencies**

   ```bash
   npm install
   ```

   `postinstall` runs `prisma generate` automatically. If npm warns that some packages have install scripts not covered by `allowScripts`, approve them and install again:

   ```bash
   npm install-scripts approve <package>
   npm install
   ```

3. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>. On start-up the server creates or updates the tables from `prisma/migrations/` and seeds the default categories; check the terminal for `Database migrations applied.`

## Scripts

| Command                 | Description                                               |
| ----------------------- | --------------------------------------------------------- |
| `npm run dev`           | Start the development server                              |
| `npm run build`         | Create a production build                                 |
| `npm run start`         | Run the production build                                  |
| `npm run lint`          | Lint the project with ESLint                              |
| `npm run lint:fix`      | Lint and auto-fix what can be fixed                       |
| `npm run format`        | Format all files with Prettier                            |
| `npm run format:check`  | Check formatting without changing files (useful in CI)    |
| `npm run typecheck`     | Type-check with `tsc --noEmit`                            |
| `npm test`              | Run unit tests once                                       |
| `npm run test:watch`    | Run unit tests in watch mode                              |
| `npm run test:coverage` | Run unit tests with coverage (fails below 70% lines)      |
| `npm run db:generate`   | Regenerate the Prisma client                              |
| `npm run db:migrate`    | Create and apply a new migration after editing the schema |
| `npm run db:deploy`     | Apply pending migrations                                  |
| `npm run db:seed`       | Insert default data (safe to run repeatedly)              |

## Changing the database schema

1. Edit `prisma/schema.prisma`.
2. Run `npm run db:migrate -- --name <short-description>` to generate a migration under `prisma/migrations/`.
3. Commit the migration. Other environments pick it up automatically on the next start.

## Versioning

The app version lives in `package.json` only and is shown next to the logo in the header. Frontend and backend ship together, so this one number covers both.

Every push to `main` that touches the app runs [`bump-version.yml`](.github/workflows/bump-version.yml), which bumps the patch version, commits it with `[skip ci]` (so no workflow runs again) and tags `vX.Y.Z`. For a minor or major release, run the workflow manually from the Actions tab.

The workflow pushes through a GitHub App so it can bypass branch protection. Add these repository secrets: `APP_CLIENT_ID` and `APP_PRIVATE_KEY`.

## Project structure

```
koukou/
├── prisma/              # Database schema and seed entry
│   └── migrations/      # Generated migrations, applied on start-up
├── public/              # Static assets (logo)
└── src/
    ├── app/             # Pages, layout and API routes
    ├── components/      # UI components
    ├── hooks/           # Client-side data hooks (call the API, never the DB)
    ├── lib/             # Prisma client, validation schemas and shared utilities
    ├── services/        # Business logic and all database access
    ├── test/            # Shared test helpers
    └── types/           # DTOs returned by the API
```

Only `src/services/` may access the database, through the single Prisma client in `src/lib/db.ts`. The UI talks to the API routes, and API routes call services. ESLint enforces this rule.
