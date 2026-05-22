import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const manageUsers = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected successfully!');

    // 1. Fetch and show currently registered users
    console.log('\n--- Fetching Currently Registered Users ---');
    const users = await User.find({}).select('-password'); // Exclude password field for security
    
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.log(`Found ${users.length} registered users:`);
      users.forEach((user, index) => {
        console.log(`[${index + 1}] Name: ${user.name} | Email: ${user.email} | Created At: ${new Date(user.createdAt).toLocaleString()}`);
      });
    }

    // 2. Clear all users
    console.log('\n--- Clearing All Users ---');
    const deleteResult = await User.deleteMany({});
    console.log(`Successfully deleted ${deleteResult.deletedCount} users from the database.`);

  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    // 3. Close the database connection
    console.log('\nClosing MongoDB connection...');
    mongoose.connection.close();
    process.exit();
  }
};

manageUsers();
