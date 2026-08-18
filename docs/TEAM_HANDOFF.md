# Team handoff

## Fahim — lead, backend, auth, infrastructure

Primary ownership:

- `server/src/config/`
- `server/src/models/`
- `server/src/middleware/`
- `server/src/controllers/authController.js`
- `server/src/routes/authRoutes.js`
- `server/src/app.js`, `server/src/server.js`
- `.env` configuration, Atlas, Render, Vercel, and integration merges

FR coverage: FR-01, FR-02, FR-21, FR-22.

## Nody — admin console

Primary ownership:

- `client/src/components/AdminCrud.jsx`
- `client/src/pages/admin/`
- `server/src/config/adminResources.js`
- `server/src/controllers/adminController.js`
- `server/src/routes/adminRoutes.js`

The single `AdminCrud` component renders Lawyers, Services, Case Studies, Blog, and FAQ from `adminConfigs.js`. Add fields and table columns in the configuration rather than copying the page. FR coverage: FR-15 through FR-20.

## Nirjon — public site

Primary ownership:

- `client/src/layouts/PublicLayout.jsx`
- `client/src/pages/public/`
- `server/src/controllers/publicController.js`
- `server/src/routes/publicRoutes.js`

FR coverage: FR-03 to FR-06 and FR-11 to FR-14, plus responsive public styling.

## Shama — consultation and role dashboards

Primary ownership:

- `client/src/pages/client/`
- `client/src/pages/lawyer/`
- `client/src/pages/public/ConsultationPage.jsx`
- `server/src/controllers/consultationController.js`
- `server/src/controllers/lawyerController.js`
- client/lawyer/consultation routes

FR coverage: FR-07 to FR-10 plus testimonial submission and approval workflow integration.

## Suggested Git workflow

1. Fahim merges the baseline models, authentication, and route mounts.
2. Each member branches from that same baseline.
3. Merge public site and consultation dashboards.
4. Merge the admin console after its API contract is stable.
5. Run `npm run check`, seed a fresh demo database, and test all three roles before deployment.

Do not commit `.env`, replace another member's unrelated edits, or run the seed command against a shared production database.
