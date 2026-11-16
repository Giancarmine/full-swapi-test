# AGENT.md

## Project overview
This repository is a **Star Wars API Explorer** full-stack project centered on a Node.js/Express backend that proxies and shapes data from [SWAPI.tech](https://www.swapi.tech/api). A `frontend/` directory exists but currently contains only `frontend/vercel.json` (no app/package manifest checked in).

Primary backend capabilities:
- Browse films (`/api/films`, `/api/films/:id`)
- Browse characters (`/api/characters`, `/api/characters/:id`)
- Manage favorites in-memory (`/api/favorites`, add/remove film & character favorites)
- Health check endpoint (`/health`)

## Repository structure
```text
full-swapi-test/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vercel.json
│   ├── src/
│   │   ├── index.js              # Server bootstrap (dotenv, listen)
│   │   ├── app.js                # Express app, middleware, routes, error handler
│   │   ├── routes/               # Route modules (films, characters, favorites)
│   │   ├── controllers/          # HTTP handlers
│   │   ├── services/             # SWAPI fetch/transform + favorites logic
│   │   ├── models/               # Data models (e.g. Film.js)
│   │   └── utils/                # Helpers (e.g. swapiClient)
│   └── tests/
│       ├── jest.config.js
│       ├── unit/
│       ├── integration/
│       └── routes/
├── frontend/
│   └── vercel.json               # Present; frontend source not populated
├── .github/workflows/
│   ├── backend-ci.yml
│   └── frontend-ci.yml
├── docker-compose.yml
├── README.md
└── LICENSE
```

## Tech stack & dependencies
### Backend (`backend/package.json`)
- **Runtime:** Node.js + Express 5
- **HTTP/client & middleware:** `axios`, `cors`, `helmet`, `morgan`, `dotenv`
- **Testing/dev:** `jest`, `supertest`, `nodemon`
- **Scripts:**
  - `npm start` → `node src/index.js`
  - `npm run dev` → `nodemon src/index.js`
  - `npm test` → `jest`

### Frontend
- README describes a React app, but `frontend/package.json` is not present in the repository snapshot; only deployment/config artifacts may exist.

## How it works (backend)
- `src/index.js` loads env vars and starts the server on `PORT` (default `5000`) / `HOST` (default `localhost`).
- `src/app.js` configures middleware (`helmet`, `cors`, JSON parsing, `morgan("dev")`), mounts API routes under `/api`, exposes `/health`, and returns a generic 500 error payload (includes message only in development).
- `src/routes/index.js` composes domain routers:
  - `/api/films` → `filmRoutes`
  - `/api/characters` → `characterRoutes`
  - `/api/favorites` → `favoriteRoutes`
- Services fetch from SWAPI via a shared client/util and transform responses into app-friendly shapes (e.g. films include `id`, `title`, `director`, `releaseDate`, `openingCrawl`, `characters` IDs, `episodeId`, and a `coverImage` URL from starwars-visualguide assets).
- Error handling in services accounts for upstream 404/429 cases where applicable.
- Favorites are handled via controller/service layer (in-memory behavior implied by implementation style; verify in `favoriteService.js` before assuming persistence).

## Local development
### Prerequisites
- Node.js/npm (CI uses Node 20 for backend workflow)
- Optional: Docker + Docker Compose

### Run backend directly
```bash
cd backend
npm install
npm start        # or: npm run dev
```
Default endpoints:
- `http://localhost:5000/health`
- `http://localhost:5000/api/...`

### Run with Docker Compose
From repository root:
```bash
docker compose up --build
```
`docker-compose.yml` runs the backend on port `5000` with:
- `NODE_ENV=development`
- `PORT=5000`
- `SWAPI_BASE_URL=https://www.swapi.tech/api`

## Testing & CI
- Backend tests live under `backend/tests/` (`unit/`, `integration/`, `routes/`, with `jest.config.js`).
- Run locally: `cd backend && npm test`.
- `.github/workflows/backend-ci.yml` installs deps, runs tests, and runs `npm run lint` in `backend/` on push/PR conditions (note: `lint` script is not defined in current `backend/package.json`; CI may fail unless added).
- `.github/workflows/frontend-ci.yml` exists for frontend checks, but frontend source/tooling may be incomplete.

## Conventions & notes for agents
- **Preserve existing style:** CommonJS modules (`require`/`module.exports`), Express route/controller/service layering.
- **API base path:** backend routes are mounted at `/api`.
- **External data source:** SWAPI.tech (`https://www.swapi.tech/api`); some responses are transformed and enriched (e.g. cover images).
- **Configuration:** uses environment variables via `dotenv` (e.g. `PORT`, `HOST`, `NODE_ENV`, `SWAPI_BASE_URL`).
- **Be careful with frontend assumptions:** repository docs mention React frontend, but implementation files may be missing; inspect before making frontend changes.
- **Validate CI scripts:** workflows may reference scripts (like `lint`) that are absent from manifests.
- **Generated/lock files:** `backend/package-lock.json` is committed; avoid unnecessary churn.

## Useful entry points for changes
- Add/modify API behavior: `backend/src/routes/*`, `backend/src/controllers/*`, `backend/src/services/*`
- App wiring/middleware/errors: `backend/src/app.js`, `backend/src/index.js`
- SWAPI integration details: `backend/src/utils/swapiClient*` and service modules
- Tests: `backend/tests/**`
- Deployment/containerization: `backend/Dockerfile`, `backend/vercel.json`, `docker-compose.yml`, `.github/workflows/*`
