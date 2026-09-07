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
- DELETE /services/:id: permanently removes that service; returns `{ success, message }`.

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

## Pending integration

`/lawyer/*`, `/admin/*` and client testimonial routes are not mounted yet. The existing management routes listed above are protected with Firebase verification and the MongoDB admin role. Lawyer/admin dashboard wiring, assignment and testimonials remain pending.
