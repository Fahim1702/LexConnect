import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Resolve from this file so root-level and workspace commands use the same .env.
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
