const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Community = require('./models/Community');
const Post = require('./models/Post');

const seedDatabaseFixed = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Community.deleteMany({});
    await Post.deleteMany({});
    console.log('Cleared existing data');

    // Create users with proper password hashing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);
    
    console.log('Hashed password length:', hashedPassword.length);

    const users = [
      {
        username: 'sarah_mit',
        email: 'sarah@mit.edu',
        password_hash: hashedPassword,
        display_name: 'Sarah Chen',
        university: 'MIT',
        verified: true,
        karma: 3847
      },
      {
        username: 'alex_harvard',
        email: 'alex@harvard.edu',
        password_hash: hashedPassword,
        display_name: 'Alex Chen',
        university: 'Harvard',
        verified: true,
        karma: 2847
      },
      {
        username: 'math_student',
        email: 'jordan@stanford.edu',
        password_hash: hashedPassword,
        display_name: 'Jordan Kim',
        university: 'Stanford',
        verified: false,
        karma: 1523
      },
      {
        username: 'quantum_dev',
        email: 'sarah.wilson@mit.edu',
        password_hash: hashedPassword,
        display_name: 'Dr. Sarah Wilson',
        university: 'MIT',
        verified: true,
        karma: 5849
      }
    ];

    // Insert users directly to avoid pre-save hook
    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);

    // Create communities
    const communities = [
      {
        name: 'computer-science',
        display_name: 'Computer Science',
        description: 'Discussions about programming, algorithms, and CS concepts',
        category: 'academic',
        subject: 'Computer Science',
        members: 15847,
        created_by: createdUsers[0]._id,
        icon_url: ''
      },
      {
        name: 'mathematics',
        display_name: 'Mathematics',
        description: 'Pure and applied mathematics discussions',
        category: 'academic',
        subject: 'Mathematics',
        members: 12453,
        created_by: createdUsers[1]._id,
        icon_url: ''
      },
      {
        name: 'mit-students',
        display_name: 'MIT Students',
        description: 'Community for MIT students',
        category: 'university',
        subject: 'General',
        members: 8934,
        created_by: createdUsers[0]._id,
        icon_url: ''
      }
    ];

    const createdCommunities = await Community.insertMany(communities);
    console.log(`Created ${createdCommunities.length} communities`);

    console.log('Database seeded successfully!');
    console.log('Demo accounts:');
    console.log('Username: sarah_mit, Password: password123');
    console.log('Username: alex_harvard, Password: password123');
    console.log('Username: math_student, Password: password123');
    console.log('Username: quantum_dev, Password: password123');

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabaseFixed();
