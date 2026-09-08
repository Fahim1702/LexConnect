# LexConnect BD

A React, Express and MongoDB course project with Firebase Authentication. The MVP implementation is on `backend-auth`.

## Current working scope

- Public home, services, lawyer directory, case studies, blog and FAQ APIs.
- Public contact and guest consultation forms, including an optional preferred lawyer.
- Firebase email/password registration, sign-in, sign-out and MongoDB profile synchronization, once the team configures Firebase.
- Client profile editing and viewing/cancelling owned pending consultations.
- Admin-only service CRUD and consultation list/read/status-update APIs.
- Admin overview and consultation management, including validated lawyer assignment and cancellation history.
- Admin lawyer profile creation for existing Firebase-linked accounts, editing, archiving and reactivation.
- Lawyer profile editing and assigned consultation updates with private notes.
- Lawyer-owned blog editing/publishing/hiding and admin blog management.
- Client testimonials for resolved consultations, with admin approval before public display.
- Admin service, case-study and FAQ management, account activation controls and contact inbox.
- Archiving preserves service references and existing consultation records.

The running backend is `server/src/server.js`. It mounts the existing public routes and retains the CRUD routes built during the lab. `server/src/app.js` is the older full-app assembly and is not the current entry point.

## First-time setup

Use Node.js 22.12 or later (the installed Vite version also accepts Node 20.19 within the 20.x series). Install MongoDB locally, or obtain your own Atlas database credentials and network access.

From the repository root:

```sh
npm ci
npm run setup
```

`setup` creates missing `server/.env` and `client/.env` files. It never overwrites existing files or prints credentials. Follow [Firebase setup](docs/FIREBASE_SETUP.md) to enable sign-in; existing environment files need the new Firebase keys added manually.

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

## Optional fictional demo data

```sh
npm run seed:demo
```

Adds 3 fictional lawyers and 3 clients with sample consultations, articles, case studies, FAQs and a review. The records are fictional; emails use `.example.test`, and avatars are local illustrations. Reruns preserve existing records and edits. This command writes to your configured development database and refuses production mode.

These are MongoDB demonstration profiles, not Firebase login accounts. There are no demo passwords or authentication bypasses. Register real test accounts for role-based sign-in tests. See [demo data](docs/DEMO_DATA.md).

## Verification

```sh
npm run check
npm run test:integration
```

`check` verifies frontend imports, setup behavior, backend HTTP/CORS/error tests and the frontend production build. It does not require MongoDB.

`test:integration` uses the configured MongoDB server but overrides the database name with a unique `lexconnect_smoke_...` database. It tests public routes, protected CRUD, role enforcement, identity synchronization and client ownership, then removes only that temporary database. Firebase verification is mocked in automated tests; real Firebase credentials and signature verification must also be tested using the manual steps in the setup guide. The database user needs permission to create and remove the test database. The configured application's collections are untouched.

## Common setup problems

| Symptom | Check |
|---|---|
| API reports a database connection failure | Confirm MongoDB is running, the URI names your database, Atlas credentials/network access are correct, and the DNS setting works on your network. |
| Port already in use | Stop your earlier development server or change the corresponding port and environment variables together. |
| Browser shows Network Error | Confirm the API health URL responds and `CLIENT_URL` exactly matches the browser origin. |
| No services | Run the optional starter seed against your own development database. |
| Sign-in is unavailable | Complete the Firebase setup guide and restart both processes. |
| Dashboard sections return 404 | Pull the latest project branch and restart the API using the root `npm run dev` command. The active entry point is `server/src/server.js`. |
| Teammates still get missing public routes | Confirm they have the integration commit from `backend-auth`; installing dependencies alone does not update their branch. |

See [MVP handoff and demo checks](docs/MVP_HANDOFF.md) for feature coverage and the remaining real-account/browser checks.

## Team workflow

Commit only source code and `.env.example` templates. Keep real environment files ignored. Never share database credentials through Git.

See [team handoff](docs/TEAM_HANDOFF.md) for branch and ownership guidance and [API contracts](docs/API.md) for implemented endpoints. Changes on `backend-auth` must be pushed before teammates can fetch them. Do not commit directly to or merge into `main` without the team's review.

Management APIs now require a verified Firebase ID token and an active MongoDB administrator role. New accounts always start as clients. Role assignment is a trusted administrator action, never a registration field.

The Firebase Admin dependency currently has six moderate transitive audit findings involving `uuid`. Compatible audit fixes were applied; no forced downgrade or untested dependency override was introduced.
