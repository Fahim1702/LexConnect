# Current API contracts

Base URL: `http://localhost:5000/api`. JSON responses use `success`. This describes the routes actually mounted by `server/src/server.js` on `backend-auth`.

## Public website

| Method and path | Response |
|---|---|
| GET /health | `{ success, message }` |
| GET /public/home | `{ success, data: { services, lawyers, caseStudies, testimonials, stats } }` |
| GET /public/services | `{ success, items, pagination }` |
| GET /public/services/:slugOrId | `{ success, service, lawyers, caseStudies }` |
| GET /public/lawyers | `{ success, items, pagination }` |
| GET /public/lawyers/:slugOrId | `{ success, lawyer, caseStudies }` |
| GET /public/case-studies | `{ success, items }` |
| GET /public/case-studies/:slugOrId | `{ success, item }` |
| GET /public/blog | `{ success, items, pagination }` |
| GET /public/blog/:slugOrId | `{ success, item }` |
| GET /public/faqs | `{ success, items }` |
| POST /public/contact | 201: `{ success, message, id }` |

Services support `q`, `category`, `page`, `limit`; lawyers support `q`, `service`, `minExperience`, `page`, `limit`; blog supports `q`, `category`, `page`, `limit`. Page and limit are positive integers; limit is capped at 50. Empty lists are valid responses.

Contact body: required `name`, `email`, `subject`, `message`; optional `phone`.

## Firebase authentication

React registers and signs in directly through Firebase's email/password SDK. Send a current Firebase ID token in `Authorization: Bearer <token>`. The API verifies it with Firebase Admin, including revocation/disabled-user checks, and reads roles from MongoDB.

- POST /auth/sync: requires a verified token; creates or loads the MongoDB profile. Optional `name` and `phone` are editable. UID and email come from the verified token; new users always get role `client`.
- GET /auth/me: requires an active synchronized user; returns `{ success, user }`.
- PATCH /auth/me: updates only `name` and `phone`.
- POST /auth/logout: revokes the Firebase user's existing sessions; the frontend also signs out locally.

There are no custom `/auth/login` or `/auth/register` password endpoints. The backend never accepts a client-selected role or signs its own login JWT. See [Firebase setup](FIREBASE_SETUP.md).

## Services CRUD (administrator only)

- GET /services: `{ success, items }`.
- GET /services/:id: `{ success, item }`.
- POST /services: required `title`, `category`, `description`; returns 201 and `item`.
- PUT /services/:id: editable `title`, `category`, `description`, `isActive`; returns updated `item`.
- DELETE /services/:id: archives that service (`isActive: false`) while preserving references; returns `{ success, message }`.

## Consultations

POST /consultations accepts:

```json
{
  "guestName": "Example Client",
  "guestEmail": "client@example.com",
  "guestPhone": "01700000000",
  "service": "COPY_AN_EXISTING_SERVICE_ID",
  "subject": "Request a consultation",
  "details": "A brief description of the matter.",
  "preferredDate": "",
  "preferredLawyer": ""
}
```

For guests, the first six fields are required. With a valid token, the user's saved name/email are used and a client account is linked automatically; a supplied phone can update the contact number for this request. The service must exist and be active. An optional preferred lawyer must also exist and be active. The response is 201 with `{ success, message, request }`, including a generated reference and `pending` status. The client cannot choose the owner, reference or status at creation. An invalid supplied token is rejected instead of being treated as a guest.

- GET /consultations: administrator only; `{ success, items }`, newest first.
- GET /consultations/:id: administrator only; `{ success, item }`.
- PUT /consultations/:id: administrator only; body such as `{ "status": "in-review" }`; returns updated `item`.

## Client requests (active client role only)

- GET /client/consultations: returns only the signed-in client's requests as `{ success, items }`.
- PATCH /client/consultations/:id/cancel: cancels only an owned pending request. Other people's and guest requests return 404. An owned non-pending request returns 400.

Guest requests are never automatically claimed by matching email addresses.

Allowed statuses: `pending`, `assigned`, `in-review`, `scheduled`, `resolved`, `cancelled`. Management read/update responses populate the service's ID, title and category; the client list populates its ID and title. If that service has been deleted, `service` is `null`.

Malformed IDs or invalid data return 400; missing records return 404. Unknown routes and malformed JSON also return JSON errors.

## Admin overview and consultation assignment

All routes below require an active administrator verified through Firebase.

- GET /admin/overview: `{ success, stats, recent }` for the admin landing page.
- GET /admin/lawyers: all lawyer profiles; `?eligible=true` restricts results to active profiles with active Firebase-linked lawyer accounts.
- GET /admin/consultations: `{ success, items }`; optional `status` filter. Includes client, service, preferred-lawyer and assigned-lawyer details.
- PATCH /admin/consultations/:id: accepts only `assignedLawyer`, `status` and `adminNote`.
- DELETE /admin/consultations/:id: marks the request `cancelled` and preserves the record and its history.

Assignment example:

```json
{ "assignedLawyer": "COPY_A_LAWYER_PROFILE_ID", "adminNote": "Please review this request." }
```

Assigning a pending request changes its status to `assigned` unless an explicit status is supplied. Empty string or null unassigns it; an `assigned` request then returns to `pending` unless another status is supplied. `assigned` requires a lawyer. Invalid, inactive, non-lawyer and unmigrated accounts are rejected. Admin notes are limited to 3000 characters.

Status/assignment changes record the acting user's ID and time. Clients see the assigned lawyer's name but not admin notes or internal history. Concurrent edits to the same request return 409 rather than overwriting a newer change. The earlier PUT /consultations/:id status endpoint uses the same validation and history handling.

## Lawyer accounts and self-service

Admin-only: GET /admin/lawyer-candidates lists unlinked active Firebase accounts by name/email; POST /admin/lawyers links a selected `user` ID and professional profile, preserving its identity and granting the lawyer role. PATCH /admin/lawyers/:id edits professional fields; DELETE archives the profile. Editing `isActive` restores it. Identity fields are not editable here.

Active lawyer role and active profile required:

- GET/PATCH /lawyer/profile: own professional profile only.
- GET /lawyer/consultations: assigned requests only; omits admin notes and internal history.
- PATCH /lawyer/consultations/:id: `status` (in-review, scheduled, resolved), optional `lawyerNote` (up to 3000 characters). Closed requests cannot be reopened by lawyers.
- GET/POST /lawyer/blog: list own posts or submit a draft using title, excerpt, content, category and optional coverUrl. Author comes from authentication; new posts start as drafts.
- PATCH /lawyer/blog/:id: edit or publish an owned post using content fields and boolean isPublished. Author and featured state cannot be changed.
- DELETE /lawyer/blog/:id: hide an owned post; preserves the record.

## Admin content and operations

All endpoints require the active admin role.

| Path | Methods | Behavior |
|---|---|---|
| /admin/content/services | GET, POST | List/create services |
| /admin/content/case-studies | GET, POST | List/create case studies; references must exist |
| /admin/content/faqs | GET, POST | List/create FAQs |
| /admin/content/blog | GET, POST | List posts or create an admin-authored post |
| /admin/content/:resource/:id | PATCH, DELETE | Edit or archive; blog/case studies use isPublished, services/FAQs use isActive |
| /admin/users | GET | Names, contact fields, roles, creation dates and activation state |
| /admin/users/:id | PATCH | Boolean isActive only; administrator accounts cannot be disabled here |
| /admin/messages | GET | Contact inbox |
| /admin/messages/:id | PATCH | status: new, read, replied, archived; sends no email |
| /admin/testimonials | GET | All submitted reviews with client and consultation details |
| /admin/testimonials/:id | PATCH | Boolean isApproved; approval records admin and date, hiding clears them |

POST returns 201 and `item`; lists return `items`; edits return `item`. Editable content fields match the forms in `client/src/pages/admin/adminConfigs.js`. IDs, authors and publication timestamps cannot be overwritten through these forms. Publishing blog/case-study documents runs model hooks; concurrent document saves return 409 instead of silently overwriting a newer save.

## Client testimonials

GET /client/testimonials lists the client's reviews. POST accepts consultation ID, integer rating 1?5 and a nonblank comment up to 1200 characters. The consultation must belong to the client and be resolved. One review per consultation; duplicates return 409. Approval and ownership fields supplied by the client are ignored. Only approved reviews appear in /public/home, with name, rating, comment and approval date.

## Public filters and selection lists

GET /public/services includes `categories` for the category filter alongside `items` and `pagination`. Services, lawyers and blog pages have Previous/Next controls; changing directory filters resets the page. GET /public/case-studies accepts `service`. FAQs are grouped by category in the browser.

GET /public/service-options returns all active service IDs, titles and categories. GET /public/lawyer-options returns all available lawyer IDs, designations and names. These compact selection lists avoid truncating consultation form choices at 50 records.

Lawyer photoUrl accepts an image URL or a site-relative path. Public cards and profile pages display it, falling back to initials if the image fails.
