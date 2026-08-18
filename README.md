# LexConnect BD

LexConnect BD is a JavaScript-only MERN course project for legal service discovery, lawyer profiles, and consultation management. It implements FR-01 through FR-22 from the team scope, plus the client testimonial and admin-approval workflow.

## Technology

- Frontend: React, Vite, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express, Mongoose, JWT, bcryptjs
- Database: MongoDB (local or Atlas)
- Deployment targets: Vercel for `client`, Render for `server`, MongoDB Atlas for data

## Quick start

Requirements: Node.js 20.19+ and either a local MongoDB server or an Atlas connection string.

```bash
npm install
copy server\.env.example server\.env
copy client\.env.example client\.env
npm run seed
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:5000`.

For macOS/Linux, replace `copy` with `cp`.

## Demo accounts

These are created by `npm run seed`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@lexconnect.test` | `Admin123!` |
| Client | `client@lexconnect.test` | `Client123!` |
| Lawyer | `farhana@lexconnect.test` | `Lawyer123!` |

Change the admin seed credentials in `server/.env` before running the seed. Demo passwords are for development only.

## Environment variables

Backend (`server/.env`):

- `MONGODB_URI`: local MongoDB or Atlas connection URI
- `JWT_SECRET`: long random secret used to sign sessions
- `CLIENT_URL`: allowed frontend origin; comma-separate multiple origins
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`: credentials used by the seed script

Frontend (`client/.env`):

- `VITE_API_URL`: backend URL including `/api`, for example `https://your-api.onrender.com/api`

Never commit real `.env` files. Commit only the `.env.example` templates.

## Nine MongoDB collections

1. `users`
2. `lawyers`
3. `services`
4. `casestudies`
5. `blogposts`
6. `faqs`
7. `consultationrequests`
8. `testimonials`
9. `contactmessages`

Relationships use Mongoose `ObjectId` references. The former SQL-style `lawyer_services` join table is represented by the `services` array in each lawyer document, keeping the required total at nine collections.

## Main scripts

```bash
npm run dev       # frontend and backend together
npm run build     # production frontend build
npm run start     # production backend
npm run seed      # replace the database with demo data
npm run check     # backend syntax/tests and frontend production build
```

`npm run seed` is destructive to the configured database. Use it only for a development/demo database.

## Deployment

### MongoDB Atlas

Create a cluster, database user, and network-access rule. Copy the connection URI into Render as `MONGODB_URI`. Use a separate demo database, not a personal production database.

### Render backend

The root `render.yaml` is ready for a Render Blueprint. Set `MONGODB_URI` and `CLIENT_URL` in Render. The health check is `/api/health`.

### Vercel frontend

Import the repository, set the project root to `client`, and set `VITE_API_URL` to the deployed Render API URL ending in `/api`. `client/vercel.json` preserves React Router URLs on refresh.

## Team ownership

See [docs/TEAM_HANDOFF.md](docs/TEAM_HANDOFF.md) for file ownership and a merge order designed to reduce conflicts. See [docs/API.md](docs/API.md) for the route map.
