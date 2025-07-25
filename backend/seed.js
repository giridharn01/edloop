const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Community = require('./models/Community');
const Post = require('./models/Post');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Community.deleteMany({});
    await Post.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const users = [
      {
        username: 'sarah_mit',
        email: 'sarah@mit.edu',
        password_hash: 'password123', // Will be hashed by model
        display_name: 'Sarah Chen',
        university: 'MIT',
        verified: true,
        karma: 3847
      },
      {
        username: 'alex_harvard',
        email: 'alex@harvard.edu',
        password_hash: 'password123',
        display_name: 'Alex Chen',
        university: 'Harvard',
        verified: true,
        karma: 2847
      },
      {
        username: 'math_student',
        email: 'jordan@stanford.edu',
        password_hash: 'password123',
        display_name: 'Jordan Kim',
        university: 'Stanford',
        verified: false,
        karma: 1523
      },
      {
        username: 'quantum_dev',
        email: 'sarah.wilson@mit.edu',
        password_hash: 'password123',
        display_name: 'Dr. Sarah Wilson',
        university: 'MIT',
        verified: true,
        karma: 5234
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);

    // Create communities
    const communities = [
      {
        name: 'r/ComputerScience',
        display_name: 'Computer Science',
        description: 'A community for discussing programming, algorithms, data structures, software engineering, and all things computer science. Share projects, ask questions, and learn together!',
        members: 125000,
        category: 'academic',
        subject: 'Computer Science',
        created_by: createdUsers[0]._id
      },
      {
        name: 'r/Mathematics',
        display_name: 'Mathematics',
        description: 'Mathematical discussions and problem solving for students and professionals. From calculus to abstract algebra, all levels welcome.',
        members: 89000,
        category: 'academic',
        subject: 'Mathematics',
        created_by: createdUsers[1]._id
      },
      {
        name: 'r/Physics',
        display_name: 'Physics',
        description: 'From quantum mechanics to astrophysics, explore the fundamental laws of the universe with fellow physics enthusiasts.',
        members: 76000,
        category: 'academic',
        subject: 'Physics',
        created_by: createdUsers[3]._id
      }
    ];

    const createdCommunities = await Community.insertMany(communities);
    console.log(`Created ${createdCommunities.length} communities`);

    console.log('Database seeded successfully!');
    console.log('\nDemo accounts:');
    console.log('Username: sarah_mit, Password: password123');
    console.log('Username: alex_harvard, Password: password123');
    console.log('Username: math_student, Password: password123');
    console.log('Username: quantum_dev, Password: password123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the seed function
seedDatabase();
