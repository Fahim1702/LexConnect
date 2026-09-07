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

## Services CRUD

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

The first six fields are required. The service must exist and be active. An optional preferred lawyer must also exist and be active. The response is 201 with `{ success, message, request }`, including a generated reference and `pending` status. The client cannot choose the reference or status at creation.

- GET /consultations: `{ success, items }`, newest first.
- GET /consultations/:id: `{ success, item }`.
- PUT /consultations/:id: body such as `{ "status": "in-review" }`; returns updated `item`.

Allowed statuses: `pending`, `assigned`, `in-review`, `scheduled`, `resolved`, `cancelled`. Read/update responses populate the service's ID, title and category. If that service has been deleted, `service` is `null`.

Malformed IDs or invalid data return 400; missing records return 404. Unknown routes and malformed JSON also return JSON errors.

## Pending integration

`/auth/*`, `/client/*`, `/lawyer/*` and `/admin/*` are not mounted yet. Management endpoints currently have no authentication or role protection; they are for the local rebuild until that checkpoint is implemented. Earlier documentation of the full app does not describe the current running backend.
