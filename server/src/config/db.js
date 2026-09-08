import mongoose from 'mongoose';
import dns from 'node:dns';
import './env.js';

export async function connectDatabase(options = {}) {
  if (!process.env.MONGODB_URI) {
    throw new Error('Set MONGODB_URI in server/.env before starting the API.');
  }
  // Preserve the Atlas DNS workaround; DNS_SERVERS=system uses the OS resolver.
  const servers = process.env.DNS_SERVERS ?? '1.1.1.1,1.0.0.1';
  if (process.env.MONGODB_URI.startsWith('mongodb+srv:') && servers !== 'system') {
    dns.setServers(servers.split(',').map((server) => server.trim()).filter(Boolean));
  }
  const connection = await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, ...options });
  console.log('MongoDB connected');
  return connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
