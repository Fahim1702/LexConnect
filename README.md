# LexConnect BD

A React, Express and MongoDB course project, currently being rebuilt in small, explainable checkpoints on `backend-auth`.

## Current working scope

- Public home, services, lawyer directory, case studies, blog and FAQ APIs.
- Public contact and guest consultation forms, including an optional preferred lawyer.
- Service CRUD and consultation create/read/status-update APIs.
- Login, registration and client/lawyer/admin dashboards are **not yet connected to this backend**. Their older files remain for later integration; their presence does not mean those features are complete.

The running backend is `server/src/server.js`. It mounts the existing public routes and retains the CRUD routes built during the lab. `server/src/app.js` is the older full-app assembly and is not the current entry point.

## First-time setup

Use Node.js 22.12 or later (the installed Vite version also accepts Node 20.19 within the 20.x series). Install MongoDB locally, or obtain your own Atlas database credentials and network access.

From the repository root:

```sh
npm ci
npm run setup
```

`setup` creates missing `server/.env` and `client/.env` files. It generates a JWT secret for a new server environment and never overwrites existing files or prints secrets.

Edit **your own** `server/.env`:

- `MONGODB_URI`: use the default local database only if MongoDB is running locally. For Atlas, include an explicit database name, such as `lexconnect`, in your URI and configure Atlas network access.
- `PORT=5000` and `CLIENT_URL=http://localhost:5173` match the frontend defaults.
- `DNS_SERVERS=1.1.1.1,1.0.0.1` retains the Atlas DNS workaround. Use `DNS_SERVERS=system` if your network requires its normal resolver.

Then run:

```sh
npm run seed
npm run dev
```

Seeding is optional. It adds three starter services and one FAQ without deleting records or overwriting existing content. It can be run again. It does not create demo accounts. The app also supports an empty database; directory/content pages stay empty until records are added.

Open **http://localhost:5173**. Check **http://localhost:5000/api/health** for the backend.

If you change the API port, update `VITE_API_URL` in `client/.env` to the same port, including `/api`, and restart Vite. If you change the frontend port/origin, update `CLIENT_URL` too. Vite fails clearly when port 5173 is occupied instead of silently selecting an incompatible origin.

## Verification

```sh
npm run check
npm run test:integration
```

`check` verifies frontend imports, setup behavior, backend HTTP/CORS/error tests and the frontend production build. It does not require MongoDB.

`test:integration` uses the configured MongoDB server but overrides the database name with a unique `lexconnect_smoke_...` database. It tests empty data, safe repeat seeding, public routes, CRUD and form submissions, then removes only that temporary database. The database user needs permission to create and remove that test database. It does not use the configured application's collections.

## Common setup problems

| Symptom | Check |
|---|---|
| API reports a database connection failure | Confirm MongoDB is running, the URI names your database, Atlas credentials/network access are correct, and the DNS setting works on your network. |
| Port already in use | Stop your earlier development server or change the corresponding port and environment variables together. |
| Browser shows Network Error | Confirm the API health URL responds and `CLIENT_URL` exactly matches the browser origin. |
| No services | Run the optional starter seed against your own development database. |
| Login/dashboard requests fail | Those workflows are the next integration step on this branch. |
| Teammates still get missing public routes | Confirm they have the integration commit from `backend-auth`; installing dependencies alone does not update their branch. |

## Team workflow

Commit only source code and `.env.example` templates. Keep real environment files ignored. Never share database credentials through Git.

See [team handoff](docs/TEAM_HANDOFF.md) for branch and ownership guidance and [API contracts](docs/API.md) for implemented endpoints. Changes on `backend-auth` must be pushed before teammates can fetch them. Do not commit directly to or merge into `main` without the team's review.

The CRUD management endpoints are currently part of the local development exercise. Authentication and role protection must be completed before a shared public deployment.
