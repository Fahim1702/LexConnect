import mongoose from 'mongoose';

export async function connectDatabase() {
  mongoose.set('sanitizeFilter', true);
  const connection = await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB connected: ${connection.connection.host}`);
  return connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
