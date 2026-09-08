# MVP handoff

## Implemented proposal scope

| Proposal requirements | Implementation |
|---|---|
| FR-01, FR-02, FR-22 | Firebase registration, login/logout, token verification and MongoDB role/ownership checks |
| FR-03 through FR-06 | Public services and lawyer browsing, search/filtering and detail pages |
| FR-07, FR-08 | Guest/client consultation submission and client-owned pending cancellation |
| FR-09, FR-10 | Lawyer profile editing and assigned request management |
| FR-11 through FR-14 | Public case studies, blog, FAQs and contact submission |
| FR-15 through FR-19 | Admin lawyer/service/case-study/blog/FAQ creation, editing and archiving |
| FR-20 | Consultation assignment, status management, notes and retained history |
| FR-21 | Registered account listing and activation/deactivation |

Public service category and case-study service filters, category-grouped FAQs, lawyer photos, and directory/blog pagination are connected. Lawyers can create, edit, publish and hide their own blog posts (FR-18).

Additional connected workflows: client testimonials with admin approval, and the admin contact inbox. Categories are fields on services and content. Archiving is used for removal to preserve existing relationships. Firebase Authentication replaces the proposal's original custom password/JWT implementation per the instructor's requirement.

## Verification completed

`npm run check` checks source imports, setup behavior, backend tests and the production frontend build. `npm run test:integration` exercises real HTTP and MongoDB against a temporary database, covering each role, public content visibility, assignments, private notes, publication, reviews, account activation, contact statuses and archived service references. The test database is removed afterward. Firebase identities are controlled test fixtures; a separate fault-injection case tests lawyer-profile cleanup.

## Mock content

Run `npm run seed:demo` to add labeled fictional lawyers, clients and content without overwriting existing edits. Mock users cannot authenticate; use real Firebase test accounts for the full workflow. See [demo data](DEMO_DATA.md).

## Before the demo or deployment

1. Pull this branch, install dependencies, configure local Firebase/MongoDB settings and run `npm run dev`.
2. With real Firebase accounts, test client registration/login, admin lawyer onboarding and lawyer sign-in. Use separate browser sessions for each role.
3. Submit a consultation, assign it, resolve it as the lawyer, submit a client review and approve it as admin. Confirm it appears publicly.
4. Create/publish a case study and blog post, add a service/FAQ, submit a contact message and check the admin inbox. Archive content and verify its public visibility changes.
5. Test mobile layouts and refresh a protected/deep-linked page in the browsers required for your course. Browser compatibility and the proposal's two-second performance target have not been measured by the API tests.
6. Replace sample content with team-approved, anonymized material. Do not publish confidential case details.
7. If hosting is required, configure the frontend/API origins, Firebase authorized domain and server secret file using FIREBASE_SETUP.md. Deployment and the real production sign-in flow still need verification on the chosen host.

The implementation is ready for the team's final acceptance check. This handoff does not claim that cross-browser testing, performance targets or a live deployment have been completed. No AI features, payments or real-time chat are included in the proposal's MVP.
