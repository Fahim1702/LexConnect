# Firebase Authentication setup

The instructor requires Firebase Authentication. Firebase handles registration and passwords; Express verifies Firebase ID tokens; MongoDB stores profiles, roles and application data. No Firestore database is required.

## 1. Create the team's Firebase project

1. Create or open the team project in the [Firebase console](https://console.firebase.google.com/).
2. In Authentication, enable the **Email/Password** sign-in provider.
3. In project settings, register a **Web app** and copy its Firebase configuration values.
4. Check Authentication's authorized domains for local development (`localhost`) and your eventual frontend domain.

Use the same Firebase project for the frontend and backend.

## 2. Configure the frontend locally

Add these values to `client/.env` using the web-app configuration from Firebase:

```dotenv
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-web-app-id
```

These identify the Firebase web app. Never put a service-account JSON or private key in a `VITE_` variable: Vite bundles those variables into the browser application.

## 3. Configure Firebase Admin locally

1. In Firebase project settings, open **Service accounts** and generate a private key for the Admin SDK.
2. Save the JSON file **outside the repository**, for example in your personal configuration directory. Do not paste its contents into chat or Git.
3. Add the following to `server/.env`, replacing the example path with your real absolute path:

```dotenv
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS="C:/Users/your-name/.config/lexconnect/firebase-admin.json"
```

On macOS/Linux use that machine's absolute path. Firebase Admin uses Application Default Credentials to read the file. Each teammate configures their own environment; do not distribute private keys through the repository.

Old `JWT_SECRET`, `JWT_EXPIRES_IN` and demo admin-password variables are no longer used by the current authentication code. Existing `.env` files were left untouched.

For Render, supply the credential as a **secret file** and set `GOOGLE_APPLICATION_CREDENTIALS` to its mounted absolute path. Configure `FIREBASE_PROJECT_ID` on Render and the `VITE_FIREBASE_*` values on the frontend host. Workload-provided Application Default Credentials can also be used where supported.

## 4. Run and verify a real sign-in

```sh
npm ci
npm run dev
```

Restart both processes after environment changes. Public pages load without Firebase settings, but registration/login will remain unavailable until configuration is complete.

1. Register a new client through `/register` with an 8+ character password.
2. Check that Firebase Authentication lists the account and MongoDB `users` contains its `firebaseUid`, email and `client` role, with no new password hash.
3. Submit a consultation while signed in. Check `/client`: it should show that client's request.
4. Sign out and sign in as a second client. The first client's requests must not appear.
5. Cancel your own pending request; cancellation of a different client's request must fail.
6. Refresh the browser to verify session restoration. Profile updates should persist.
7. Sign out. Returning to a protected page should require sign-in. When the API is reachable, logout also revokes that Firebase user's existing sessions; local sign-out still works during an API outage.

## Roles and old records

Every new synchronized account is a client, even if a request body claims `role: admin`. Roles are read from MongoDB on each protected request; Firebase console membership does not make an application user an admin.

For an initial administrator, a trusted project maintainer can locate their own newly registered record by its **exact Firebase UID** in MongoDB Compass and set `role` to `admin`, then sign in again. Do not promote arbitrary users or create a public role-changing endpoint. The admin overview and consultation management pages are connected. The assignment menu uses active lawyer profiles with active Firebase-linked accounts. Admins can now create those profiles from the Lawyers page.

Old MongoDB accounts without `firebaseUid` are not automatically linked by email. If an old email conflicts, a maintainer must verify ownership and deliberately migrate that record while preserving its `_id` and relationships. Old passwords are not accepted by Firebase, and old guest consultations are not claimed by email.

## What is covered by this checkpoint

- Browser email/password sign-up, sign-in, refreshed ID tokens and sign-out.
- Firebase Admin verification with revocation checks.
- MongoDB profile synchronization, active-account checks and roles.
- Admin protection for service CRUD and consultation management.
- Signed-in client ownership, viewing requests, pending cancellation and profile editing.

Admin overview, lawyer provisioning, assignment and consultation cancellation are also connected. Lawyers can edit their professional profiles and update assigned requests. Lawyer blog drafts and admin publishing are connected. Client testimonials and admin approval are also connected. Other admin content/user management and service-deletion integrity remain later tasks.

## Add a lawyer and test the workflow

1. Ask the lawyer to register and sign in through LexConnect so their Firebase account is synchronized to MongoDB.
2. As an admin, open `/admin/lawyers`, choose **Add lawyer**, select the registered account by name/email, and enter its professional details and Bar Council number. This preserves the account ID, Firebase UID and existing relationships, and assigns the lawyer role. No temporary password is needed.
3. Have the lawyer sign out and sign in again to refresh the browser's role and dashboard navigation.
4. Submit a consultation as a client. As admin, assign it to the new lawyer from `/admin/consultations`.
5. As the lawyer, open `/lawyer`, review the assigned request, save a private note and change its status to in-review, scheduled or resolved. Other lawyers must not be able to modify it. Resolved/cancelled requests cannot be reopened by lawyers.
6. Verify that the client sees the updated status but no lawyer notes, admin notes or internal history. Admins can see the notes and history.
7. Edit the professional profile at `/lawyer/profile` and verify the public directory reflects it. Account identity, Bar Council number, featured status and activation remain outside the lawyer's editable fields.

Archiving a lawyer profile hides it from the public directory and assignment menu and blocks lawyer profile/request APIs. It retains the account and consultation records. Existing assignments remain for the admin to reassign. An admin can edit the archived profile and tick **Active** to restore access.

Profile creation validates the data before changing the account role and removes the newly created profile if the role update fails. This supports standalone MongoDB without requiring transactions. If the server is interrupted between those two writes, a maintainer may need to reconcile the profile and role before retrying.

## Blog drafts and publishing

An active lawyer can create drafts from `/lawyer/blog`. Drafts are visible to their author and admins. The server assigns the author from the signed-in account and prevents lawyers from publishing their own submissions.

Admins can review and edit drafts at `/admin/blog`, then tick **Published** to make them public. **Archive** hides a post without deleting it; editing and publishing it again restores it. The first publication date is retained. Changing a title updates its URL slug, so update any shared links after renaming a published post.

## Client testimonials

After a consultation is resolved, its client can leave one review at `/client/testimonials`. Choose the consultation, a rating from 1 to 5, and a comment of up to 1200 characters. Submitted reviews stay private until an admin approves them at `/admin/testimonials`.

Approved reviews appear on the homepage with the client's name, rating and comment. They do not expose email addresses or consultation references. **Hide** removes a review from the homepage while retaining the submission. Check the flow with two client accounts to confirm that each account only sees its own submissions and cannot review another client's consultation.

## Automated checks and limits

`npm run check` runs setup, middleware and build checks without Firebase credentials. `npm run test:integration` tests real HTTP/MongoDB behavior in a temporary database using controlled identities at the Firebase SDK boundary. A separate fault-injection case simulates a failed account-role write to check profile cleanup. Production code has no test-token bypass. The temporary database is removed afterward.

These tests prove application authorization and data-handling behavior; they do not prove that the team's real Firebase configuration or login works. Complete the manual steps above once the project exists.

## Proposal wording

Replace the custom JWT/bcrypt authentication implementation description with: **Firebase Authentication for account registration, sign-in and sign-out; Firebase Admin SDK for backend ID-token verification; MongoDB for profiles, roles and ownership checks.** Firebase ID tokens still use JWT format, but LexConnect does not issue its own login tokens or hash passwords.

## Official references

- [Email/password authentication](https://firebase.google.com/docs/auth/web/password-auth)
- [Admin SDK setup and credentials](https://firebase.google.com/docs/admin/setup)
- [Verify Firebase ID tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Session revocation](https://firebase.google.com/docs/auth/admin/manage-sessions)
