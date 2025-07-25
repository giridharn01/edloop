// backend/utils/pushToAlgolia.js

require('dotenv').config(); // To load .env variables
const mongoose = require('mongoose');
const { algoliasearch } = require('algoliasearch');
const Note = require('../models/Note'); // Adjust this if your model path differs

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/edloop', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}); 

// Initialize Algolia client (v5 syntax)
const client = algoliasearch(
  process.env.ALGOLIA_APP_ID || 'HGICPYYNHI',
  process.env.ALGOLIA_ADMIN_API_KEY || 'eafce5852b578ad9fadfad734c98d0ba'
);

// Push notes data to Algolia
const pushToAlgolia = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    // Fetch all notes from MongoDB
    const notes = await Note.find()
      .populate('author', 'displayName email')
      .populate('community', 'displayName description');
    
    console.log(`Found ${notes.length} notes to index`);
    
    if (notes.length === 0) {
      console.log('No notes found to index');
      return;
    }

    // Transform notes for Algolia
    const algoliaObjects = notes.map(note => ({
      objectID: note._id.toString(),
      title: note.title,
      content: note.content,
      contentSnippet: note.content ? note.content.substring(0, 200) + '...' : '',
      author: note.author ? note.author.displayName : 'Unknown',
      subject: note.subject || 'General',
      type: 'note',
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      tags: note.tags || [],
      community: note.community ? note.community.displayName : null
    }));

    console.log('Pushing to Algolia...');
    
    // Save objects to Algolia (v5 syntax)
    const response = await client.saveObjects({
      indexName: 'edloop_notes',
      objects: algoliaObjects
    });
    
    console.log('Successfully pushed to Algolia!');
    console.log('Response:', response);
  } catch (error) {
    console.error('Error pushing to Algolia:', error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
  }
};

// Run the function
pushToAlgolia();
