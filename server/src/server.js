import 'dotenv/config';
import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';

const port = Number(process.env.PORT) || 5000;

async function start() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing. Copy server/.env.example to server/.env.');
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing. Copy server/.env.example to server/.env.');
  await connectDatabase();
  const server = app.listen(port, () => console.log(`LexConnect API listening on http://localhost:${port}`));

  const shutdown = async () => {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
