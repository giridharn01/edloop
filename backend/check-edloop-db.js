const mongoose = require('mongoose');
require('dotenv').config();

const checkEdloopDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('Database URI:', process.env.MONGODB_URI);

    const db = mongoose.connection.db;
    console.log('Database name:', db.databaseName);
    
    // Get all collections in the database
    const collections = await db.listCollections().toArray();
    console.log('\n📚 All Collections in database:');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });

    // Check specific collections for user data
    const collectionsToCheck = ['users', 'User'];
    
    for (const collectionName of collectionsToCheck) {
      console.log(`\n📊 Collection: ${collectionName}`);
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`Count: ${count}`);
        
        if (count > 0) {
          const sampleData = await collection.find({}).limit(3).toArray();
          console.log('Sample documents:');
          sampleData.forEach((doc, index) => {
            console.log(`${index + 1}.`, {
              id: doc._id,
              username: doc.username,
              email: doc.email,
              display_name: doc.display_name,
              university: doc.university,
              created: doc.createdAt || doc.join_date
            });
          });
        }
      } catch (err) {
        console.log(`Collection ${collectionName} not accessible or doesn't exist`);
      }
    }

    // Check other important collections
    const otherCollections = ['posts', 'communities', 'votes'];
    for (const collectionName of otherCollections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`\n📊 ${collectionName}: ${count} documents`);
      } catch (err) {
        console.log(`\n📊 ${collectionName}: Not accessible`);
      }
    }

    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
};

checkEdloopDatabase();
