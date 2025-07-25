const mongoose = require('mongoose');
require('dotenv').config();

const checkCollections = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check what's in the 'users' collection
    const usersCollection = db.collection('users');
    const usersCount = await usersCollection.countDocuments();
    const usersData = await usersCollection.find({}).toArray();
    
    console.log('\n📊 Collection: users');
    console.log(`Count: ${usersCount}`);
    if (usersData.length > 0) {
      console.log('Sample data:', usersData[0]);
    }

    // Check what's in the 'User' collection
    const UserCollection = db.collection('User');
    const UserCount = await UserCollection.countDocuments();
    const UserData = await UserCollection.find({}).toArray();
    
    console.log('\n📊 Collection: User');
    console.log(`Count: ${UserCount}`);
    if (UserData.length > 0) {
      console.log('Sample data:', UserData[0]);
    }

    // Check posts collection
    const postsCollection = db.collection('posts');
    const postsCount = await postsCollection.countDocuments();
    console.log(`\n📊 Collection: posts - Count: ${postsCount}`);

    // Check communities collection
    const communitiesCollection = db.collection('communities');
    const communitiesCount = await communitiesCollection.countDocuments();
    console.log(`📊 Collection: communities - Count: ${communitiesCount}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
};

checkCollections();
