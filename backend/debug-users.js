const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');

const debugUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log('Users in database:', users.length);
    
    for (const user of users) {
      console.log('User:', {
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        password_hash_length: user.password_hash ? user.password_hash.length : 'undefined'
      });
    }

    // Test password comparison for sarah_mit
    const sarah = await User.findOne({ username: 'sarah_mit' });
    if (sarah) {
      console.log('\nTesting password for sarah_mit:');
      const isValid = await sarah.comparePassword('password123');
      console.log('Password "password123" is valid:', isValid);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
};

debugUsers();
