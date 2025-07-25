const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Community = require('./models/Community');
const Post = require('./models/Post');
const Vote = require('./models/Vote');

const clearDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear all existing data to start fresh
    await User.deleteMany({});
    await Community.deleteMany({});
    await Post.deleteMany({});
    await Vote.deleteMany({});
    
    console.log('✅ Database cleared! Ready for real user data.');
    console.log('You can now:');
    console.log('1. Register new users through the frontend');
    console.log('2. Create communities');
    console.log('3. Create posts');
    console.log('4. Vote on posts');
    console.log('All data will be stored permanently in MongoDB.');

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

clearDatabase();
