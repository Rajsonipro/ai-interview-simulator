import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoConnected = false;
let mongoServer;

const connectDB = async () => {
  const uri = process.env.MONGO_URI?.trim();

  // Try connecting to MongoDB Atlas if URI is provided
  if (uri) {
    try {
      // Set a shorter timeout for the initial connection attempt so it doesn't hang the app
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      });

      console.log(`MongoDB Connected: ${conn.connection.host}`);
      mongoConnected = true;
      return;
    } catch (error) {
      console.warn(`MongoDB Atlas connection failed: ${error.message}`);
      console.log('Falling back to In-Memory Database...');
    }
  } else {
    console.log('No MONGO_URI found. Starting In-Memory Database...');
  }

  // Fallback to MongoMemoryServer
  try {
    mongoServer = await MongoMemoryServer.create();
    const memoryUri = mongoServer.getUri();
    await mongoose.connect(memoryUri);
    
    console.log('--- OFFLINE MODE ACTIVE ---');
    console.log('In-Memory Database started successfully.');
    console.log('Note: Data will NOT be persisted between server restarts.');
    console.log('---------------------------');
    mongoConnected = true;
  } catch (error) {
    console.error(`In-Memory Database failed to start: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
export { mongoConnected };