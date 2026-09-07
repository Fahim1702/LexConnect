# Team handoff

## Ownership for this rebuild

- **Member 1 (Fahim):** backend, database, authentication, API contracts and integration.
- **Member 2:** public website and client features.
- **Member 3:** lawyer and admin features.

## Getting the same runnable baseline

The integration changes are on `backend-auth`. After Fahim pushes the checkpoint, fetch that branch. Keep your own uncommitted work safe before changing branches or merging.

For a new integration branch:

```sh
git fetch origin
git switch -c your-integration-branch origin/backend-auth
npm ci
npm run setup
```

Use your own branch name. Existing teammate branches can merge `origin/backend-auth` after reviewing conflicts with their work. Do not merge `backend-auth` into `main` without Fahim's approval.

Configure your own MongoDB connection in `server/.env`, optionally run `npm run seed`, then run `npm run dev`. Full setup and troubleshooting are in [README](../README.md).

## Available for frontend work now

Public page APIs, contact and guest consultation submission are mounted by `server/src/server.js`. Firebase registration/login, client profile and owned requests are connected once the team configures the shared Firebase project. Management CRUD now needs an administrator's Firebase ID token. A service link must use `service.slug || service._id`, because services created during the rebuild may have no slug. Its summary can fall back to `description`.

The public pages can load an empty database. Add public records when needed; the starter seed only adds services and a FAQ.

## Integration status

Follow [Firebase setup](FIREBASE_SETUP.md) before testing login. The admin overview and consultation assignment page now work with active Firebase-linked lawyer accounts. Lawyer dashboard, admin content/user management, contact inbox, blog publishing and testimonials are connected. Service removal archives records to preserve relationships. See [MVP handoff](MVP_HANDOFF.md) for final demo checks. The older controllers and `server/src/app.js` are not automatically active. Old password-based demo accounts must be migrated explicitly; the API never links them to Firebase by email alone.

## Before sharing a checkpoint

Run `npm run check`. With MongoDB available, run `npm run test:integration` for the public/form/CRUD contracts. Then commit the specific changed files on your own branch and push that branch. Keep real `.env` files out of Git.
