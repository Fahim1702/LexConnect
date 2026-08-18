# API route map

All routes are prefixed by `/api`.

## Authentication

- `POST /auth/register` — create a client account
- `POST /auth/login` — issue JWT
- `POST /auth/logout` — clear auth cookie
- `GET /auth/me`, `PATCH /auth/me` — current account

Send the JWT as `Authorization: Bearer <token>`. The API also accepts the HTTP-only cookie it sets on login.

## Public

- `GET /public/home`
- `GET /public/services`, `GET /public/services/:slugOrId`
- `GET /public/lawyers`, `GET /public/lawyers/:slugOrId`
- `GET /public/case-studies`, `GET /public/case-studies/:slugOrId`
- `GET /public/blog`, `GET /public/blog/:slugOrId`
- `GET /public/faqs`
- `POST /public/contact`
- `POST /consultations` — guest or authenticated client

## Client role

- `GET /client/consultations`
- `PATCH /client/consultations/:id/cancel`
- `GET /client/testimonials`
- `POST /client/testimonials`

## Lawyer role

- `GET /lawyer/profile`, `PATCH /lawyer/profile`
- `GET /lawyer/consultations`, `PATCH /lawyer/consultations/:id`
- `GET /lawyer/blog`, `POST /lawyer/blog`

## Admin role

- `GET /admin/overview`
- `GET|POST /admin/lawyers`, `PATCH|DELETE /admin/lawyers/:id`
- `GET|POST /admin/content/:resource`, `GET|PATCH|DELETE /admin/content/:resource/:id`
- Valid content resources: `services`, `case-studies`, `blog`, `faqs`
- `GET /admin/consultations`, `PATCH|DELETE /admin/consultations/:id`
- `GET /admin/users`, `PATCH /admin/users/:id`
- `GET /admin/testimonials`, `PATCH /admin/testimonials/:id`

Delete endpoints soft-archive public content and consultations instead of permanently deleting records.
