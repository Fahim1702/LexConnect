# Deploy LexConnect: Render API and Vercel frontend

## Repository preparation

Merge the deployment configuration branch through your normal pull-request workflow, or choose that branch for the first deployment. Both hosting projects must use the repository root. The root package-lock.json controls this npm workspace.

The root vercel.json configures the frontend build and client/dist output. The older client/vercel.json is only relevant if a separate project is explicitly rooted at client; the setup below uses the repository root.

## Credentials

Rotate any MongoDB database password shared in chat before deployment. Update its local server/.env value privately and use the new URI in Render. Never add the URI or Firebase private-key JSON to Git or this document.

JWT_SECRET, JWT_EXPIRES_IN and ADMIN_* variables are legacy settings, not the active authentication configuration. Do not copy them into hosting. If an exposed password was reused for an actual Firebase or other account, change that account password too.

The Windows GOOGLE_APPLICATION_CREDENTIALS path cannot work on Render. Upload the actual Firebase Admin JSON directly as a Render secret file named firebase-admin.json; do not paste it into chat. Its hosted path is /etc/secrets/firebase-admin.json.

## 1. Deploy the backend on Render

Create a Node web service connected to this GitHub repository. Choose the branch containing these changes.

| Setting | Value |
|---|---|
| Root directory | Leave blank (repository root) |
| Build command | npm ci --workspace server --omit=dev |
| Start command | npm run start --workspace server |
| Health-check path | /api/health |
| Node version | 24.18.0 via NODE_VERSION |

Select a service plan in your own account. No hosting purchase is performed by these repository changes.

Set environment variables in Render:

| Key | Value |
|---|---|
| NODE_ENV | production |
| NODE_VERSION | 24.18.0 |
| DNS_SERVERS | system |
| MONGODB_URI | Rotated Atlas connection URI, including the intended database name |
| FIREBASE_PROJECT_ID | Your existing Firebase project ID |
| GOOGLE_APPLICATION_CREDENTIALS | /etc/secrets/firebase-admin.json |
| CLIENT_URL | Your exact Vercel HTTPS origin, no trailing slash; see step 3 |

Let Render supply PORT. Do not copy PORT=5000 from the local environment.

Add the Firebase Admin JSON as a secret file before expecting authenticated routes to work. Connect the database by adding the Render service's outbound IP ranges to the Atlas project network access list. Get the ranges from Render's Connect ? Outbound section. This is separate from MongoDB database-user credentials.

If you do not yet have the frontend URL, you can temporarily use http://localhost:5173 for CLIENT_URL to get the API started; replace it with the Vercel origin in step 3. This temporarily allows the local frontend origin and does not configure hosted browser access.

Deploy and record the assigned HTTPS API URL. Visit https://YOUR-API-HOST/api/health and confirm success. A health response alone does not verify Firebase credentials or public database queries; also open /api/public/services.

render.yaml supplies the same backend settings for a Blueprint import. Secret values and the secret file must still be supplied through your account.

## 2. Deploy the frontend on Vercel

Import the same repository as a new Vercel project:

| Setting | Value |
|---|---|
| Root directory | Repository root (./), not client |
| Framework | Vite |
| Install command | npm ci |
| Build command | node scripts/validate-deploy-env.mjs && npm run build |
| Output directory | client/dist |
| Node version | 24.x |

The root vercel.json supplies the build settings. Before deploying, enter:

- VITE_API_URL=https://YOUR-API-HOST/api
- VITE_FIREBASE_API_KEY: the web-app API key from client/.env
- VITE_FIREBASE_AUTH_DOMAIN: the web-app auth domain
- VITE_FIREBASE_PROJECT_ID: the web-app project ID, matching the API
- VITE_FIREBASE_APP_ID: the web-app application ID

Use the Firebase web configuration, never the Admin service-account key. Set the variables for the environment you deploy; configure Preview separately if you want preview deployments to work. Changing VITE_* variables requires a new build/deployment.

The hosted build checks that required values are present and the API URL is HTTPS. It does not verify that Firebase accepts the values.

## 3. Connect the two deployments

1. Copy the stable Vercel production origin, such as https://YOUR-PROJECT.vercel.app.
2. Set Render CLIENT_URL to that exact origin and redeploy the API. Multiple deliberately allowed origins can be comma-separated; avoid trailing slashes and wildcard origins.
3. In Firebase Authentication settings, add the Vercel hostname to Authorized domains. Enter only the hostname, without https:// or a path. Ensure Email/Password sign-in is enabled.
4. Open the Vercel site. Confirm public records load and browser requests go to the Render host, not localhost.
5. Register/sign in using a real Firebase account. For an initial admin, use the verified UID to locate the account in MongoDB and set its role through a trusted maintainer. Legacy ADMIN_PASSWORD does not create an admin login.

## 4. Verify the hosted workflow

- Load /services and refresh /lawyers/a-valid-slug directly to verify SPA routing.
- Register a client, submit a request and check the client dashboard.
- Sign in as admin, assign a request and verify the lawyer can resolve it.
- Confirm public content and testimonial visibility changes as expected.
- Verify logout and that a second client cannot see the first client's requests.
- If browser requests fail while API URLs open directly, check the exact CLIENT_URL origin and redeploy.
- If sign-in fails with API errors, check the Render secret-file name/path and that both apps use the same Firebase project.

The same Atlas database will show the existing development records online. Choose deliberately whether this academic deployment should use those records or a separate database. Do not reseed automatically during deployment; production mode rejects the fictional-data seed command.

## Official references

- [Render monorepos](https://render.com/docs/monorepo-support)
- [Render secrets](https://render.com/docs/configure-environment-variables)
- [Render outbound IPs](https://render.com/docs/outbound-ip-addresses)
- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
