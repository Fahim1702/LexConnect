// Run only for the hosted frontend build; local builds still support setup without Firebase.
const required = ['VITE_API_URL', 'VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID'];
const missing = required.filter(key => !process.env[key]?.trim());
if (missing.length) {
  console.error(`Set these Vercel environment variables before building: ${missing.join(', ')}`);
  process.exit(1);
}
try {
  const url = new URL(process.env.VITE_API_URL);
  if (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !url.pathname.endsWith('/api') || url.username || url.password || url.search || url.hash) throw new Error();
} catch {
  console.error('VITE_API_URL must be the public HTTPS API URL ending in /api, without credentials, query parameters or a trailing slash.');
  process.exit(1);
}
console.log('Frontend deployment settings are present.');
