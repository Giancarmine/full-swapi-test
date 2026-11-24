# Star Wars API Explorer

A Star Wars explorer with a Node.js/Express backend that proxies and transforms data from [SWAPI.tech](https://www.swapi.tech/api), plus a Vite + React frontend for browsing films/characters and managing user-scoped favorites.

## Project status
- **Backend:** implemented (films, characters, favorites, health check, OpenAPI docs/validation, rate limiting, Jest/Supertest tests)
- **Frontend:** implemented (Vite + React app in `frontend/`)
- **Backend:** implemented (films, characters, favorites, health/readiness endpoints, metrics, OpenAPI docs/validation, rate limiting, bounded cache, Jest/Supertest tests)
- **Frontend:** implemented (Vite + React app in `frontend/`, with Playwright E2E coverage)
- **Caching:** bounded in-memory TTL cache with LRU eviction and in-flight de-duplication for SWAPI-derived responses (non-persistent, per-process)
- **Favorites:** scoped by optional `X-User-Id` header (default `anonymous`; max 64 chars, `[A-Za-z0-9._-]`) with a repository abstraction backed by SQLite locally/in Docker and an in-memory adapter for tests/serverless fallbacks
- **Observability:** request metrics at `/metrics`, readiness at `/health/ready`, gzip compression, and cacheable list responses

## Repository structure
```text
.
├── backend/                  # Express API, OpenAPI spec, tests, Dockerfile
├── frontend/                 # Vite + React app
├── .github/workflows/        # Backend CI, frontend CI, security checks
├── .github/dependabot.yml    # Automated dependency/action updates
├── docker-compose.yml        # Local backend development stack
├── backend/.env.example      # Example backend environment variables
├── frontend/.env.example     # Example frontend environment variables
└── README.md
```

## Backend API
Base URL (default): `http://localhost:5000`

- `GET /health` — service health check
- `GET /health/ready` — readiness check (favorites store reachable; `503` when not)
- `GET /metrics` — Prometheus exposition-format metrics
- `GET /api/films` — list films
- `GET /api/films/:id` — film details
- `GET /api/characters` — list characters
- `GET /api/characters/:id` — character details
- `GET /api/favorites` — list favorites for the current user scope
- `POST /api/favorites/films/:id` — add favorite film
- `POST /api/favorites/characters/:id` — add favorite character
- `DELETE /api/favorites/films/:id` — remove favorite film
- `DELETE /api/favorites/characters/:id` — remove favorite character
- `GET /api-docs` — Swagger UI (non-production only)

### Favorites scoping and persistence
- Favorites endpoints accept an optional `X-User-Id` header; if omitted, `anonymous` is used.
- User IDs must be 1-64 characters using only letters, digits, `.`, `_`, or `-`; invalid IDs are rejected with `400`.
- The store is bounded: `FAVORITES_MAX_USERS` (default `10000`) and `FAVORITES_MAX_ITEMS` per list (default `100`). Exceeding either returns `429`. Reads never create new user entries, and empty entries are removed.
- Storage is selected with `FAVORITES_STORE`:
  - `sqlite` (default outside tests): durable local/Docker database at `FAVORITES_DB_FILE` (default `backend/data/favorites.db`); uses the built-in `node:sqlite` module, so no native build step is needed.
  - `json`: legacy JSON file at `FAVORITES_DATA_FILE` with atomic writes (also selected automatically when `FAVORITES_DATA_FILE` or `FAVORITES_PERSIST=true` is set without an explicit store).
  - `memory`: per-process `Map`, used by default in tests and as a safe fallback if another adapter cannot be opened.
- Persistence is disabled in tests by default (`NODE_ENV=test`) unless explicitly enabled with `FAVORITES_PERSIST=true`.
- `X-User-Id` is not authenticated: this is demo-only identity scoping. Do not treat it as a privacy or authorization boundary without adding real authentication.

### Validation, errors, and rate limiting
- Requests are validated at runtime against `backend/docs/openapi.yaml` via `express-openapi-validator`.
- API responses use a consistent error payload shape: `{ "error": string, "code"?: string, "details"?: [...] }`.
- Every response includes an `X-Request-Id` header (incoming values are reused when valid).
- `/api` routes are rate limited (`API_RATE_LIMIT_MAX`, default `300` requests per 15 minutes per IP).
- Production logs are structured JSON; development uses `morgan` output.
- CORS is open by default; set `CORS_ORIGINS` to a comma-separated allowlist in production.
- `TRUST_PROXY` configures Express `trust proxy` (default `loopback`, `1` for a single reverse proxy hop).
- Responses are gzip-compressed when the client accepts it; film/character lists include weak `ETag` and `Cache-Control` headers (tune with `LIST_CACHE_CONTROL`).
- `/metrics` exposes HTTP request counts/durations, cache size, and Node.js process metrics. The SWAPI response cache is bounded by `CACHE_MAX_ENTRIES` (default `500`) and de-duplicates concurrent loads.

## Getting started

### Prerequisites
- Node.js `22.x` or `24.x` (see `.nvmrc`, which pins `24`)
- npm `>=10`
- Docker + Docker Compose (optional)

### Backend (local)
```bash
cd backend
cp .env.example .env   # optional: adjust values as needed
npm ci
npm run dev            # or: npm start
```

### Frontend (local)
```bash
cd frontend
npm ci
npm run dev
```
The Vite dev server proxies `/api` and `/health` to `http://localhost:5000` (see `frontend/vite.config.js`).

### Backend with Docker Compose (development)
From the repository root:
```bash
docker compose up --build
```
- Uses the `dev` image target, mounts `backend/` into the container, and exposes port `5000`.
- Includes a container healthcheck against `GET /health`.
- Default environment values are defined in `docker-compose.yml` (can be overridden).

## Environment variables (`backend/.env.example`)
```env
PORT=5000
HOST=localhost
NODE_ENV=development
SWAPI_BASE_URL=https://www.swapi.tech/api

# TRUST_PROXY=loopback
# CORS_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app

# SWAPI_MIN_REQUEST_INTERVAL_MS=1000
# SWAPI_MAX_RETRIES=2

# FAVORITES_STORE=sqlite
# FAVORITES_DB_FILE=./data/favorites.db
# FAVORITES_DATA_FILE=./data/favorites.json
# FAVORITES_PERSIST=true
# FAVORITES_MAX_USERS=10000
# FAVORITES_MAX_ITEMS=100

API_RATE_LIMIT_MAX=300
# LIST_CACHE_CONTROL=public, max-age=60, stale-while-revalidate=300
# CACHE_MAX_ENTRIES=500
# SHUTDOWN_TIMEOUT_MS=10000
```

Frontend (`frontend/.env.example`):
```env
# Backend origin; when unset, requests are same-origin and rely on the Vite proxy in development.
VITE_API_BASE=
```

## Scripts

### Backend (`backend/`)
- `npm start` — start the API server
- `npm run dev` — start with nodemon
- `npm test` — run Jest tests (add `-- --coverage` to enforce coverage thresholds)
- `npm run test:coverage` — run Jest with coverage and thresholds
- `npm run lint` — run ESLint
- `npm run lint:fix` — auto-fix lint issues where possible
- `npm run format` — format source/tests/docs with Prettier
- `npm run format:check` — verify formatting
- `npm run docs:validate` — validate `docs/openapi.yaml` with Redocly CLI

### Frontend (`frontend/`)
- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — run ESLint
- `npm test` — run Vitest tests
- `npm run test:coverage` — run Vitest with coverage and thresholds
- `npm run test:e2e` — run the Playwright happy-path test (starts the Vite dev server automatically; run `npx playwright install chromium` once first)

#### Frontend configuration
- `VITE_API_BASE` (optional): API origin/base URL (e.g. `http://localhost:5000`). If unset, the app uses same-origin requests and relies on the Vite dev proxy for `/api` and `/health`.
- For Vercel or other static hosts, set `VITE_API_BASE` to the deployed backend origin in the project environment settings; it is baked into the build.

## Deployment

### Frontend (Vercel)
- `frontend/vercel.json` uses the Vite framework preset with `outputDirectory: "dist"` and an SPA rewrite to `index.html`.
- Set `VITE_API_BASE` in the Vercel project (Production and Preview) to the backend URL.
- The frontend is a static build; it does not proxy `/api` itself.

### Backend (Vercel)
- `backend/vercel.json` targets the serverless entrypoint `backend/api/index.js`, which exports the Express app (no `listen`).
- Serverless filesystems are ephemeral/read-only: SQLite/JSON persistence is not durable on Vercel. Set `FAVORITES_STORE=memory` there (or let the SQLite fallback handle read-only filesystems), and use an external database/Redis if favorites must survive deployments. Expect each instance to hold its own in-memory state.
- Configure `CORS_ORIGINS` to the frontend origin and set `TRUST_PROXY=1` when running behind the platform proxy.

### Backend (Docker)
- The production image uses `node:24-alpine`, runs `node src/index.js` directly as PID 1, stops on `SIGTERM`, and defines a `HEALTHCHECK` against `/health/ready`.
- `docker-compose.yml` enables `init: true` for proper signal handling in development and configures SQLite storage under `backend/data` (bind-mounted through the `./backend` volume).

## Manual verification / troubleshooting
- **Backend:** `cd backend && npm run lint && npm run format:check && npm run docs:validate && npm test -- --ci --coverage --runInBand`
- **Frontend:** `cd frontend && npm run lint && npm run test:coverage && npm run build && npm run test:e2e`
- **Docker:** from repo root run `docker compose up --build`, then verify `GET http://localhost:5000/health/ready`, `GET http://localhost:5000/metrics`, and `GET http://localhost:5000/api-docs` (non-production).
- **Favorites behavior:** send `X-User-Id` to scope favorites per user; omit it to use `anonymous`. Store selection is controlled by `FAVORITES_STORE` (`sqlite` by default), `FAVORITES_DB_FILE`, and the legacy `FAVORITES_DATA_FILE`/`FAVORITES_PERSIST` options.
- **Common issues:** ensure backend is running on port `5000` for the Vite proxy, run `npm ci` when lockfiles change, and check rate-limit responses (`429`) if `API_RATE_LIMIT_MAX` is set low.

## CI/CD & automation
GitHub workflows in `.github/workflows/`:
- **Backend CI (`backend-ci.yml`)**: runs on backend/workflow changes (and manual dispatch) with Node `22.x/24.x` matrix, `npm ci`, lint/format checks, OpenAPI docs validation, tests with enforced coverage thresholds/artifacts, and a cached Docker image build.
- **Frontend CI (`frontend-ci.yml`)**: path-filtered workflow that detects whether `frontend/package.json` exists; runs lint/test-with-coverage/build on Node `22.x/24.x`, plus a Playwright Chromium E2E job on Node `24.x`.
- **Security (`security.yml`)**: dependency review on pull requests plus push/scheduled/manual backend and frontend npm audits on Node `24.x`. Audits currently check production dependencies only because dev-only `picomatch` advisories (CVE-2026-112366) have no patched release yet.

Additional automation:
- **Dependabot (`.github/dependabot.yml`)**: weekly updates for backend/frontend npm dependencies and GitHub Actions.

## Development notes
- Backend code follows a layered structure: `routes` → `controllers` → `services` (`backend/src/`). Favorites use a repository interface (`favoriteStore.js`) so adapters (SQLite/JSON/memory) are interchangeable; `favoriteService.js` owns validation and caps.
- External data source: SWAPI.tech; responses are transformed for API consumers.
- API contract: `backend/docs/openapi.yaml` (used for Swagger UI in non-production, runtime request/response validation outside production, and contract tests).
- Controllers/services should surface API errors through centralized helpers/error handling for consistent `{ error, code?, details? }` responses.
- CI actions are pinned to commit SHAs; Dependabot manages update PRs.

## License
MIT (`LICENSE`)
