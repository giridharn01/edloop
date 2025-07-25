require('dotenv').config();
const mongoose = require('mongoose');
const Note = require('../models/Note');
const Post = require('../models/Post');
const User = require('../models/User');
const Community = require('../models/Community');
const algoliaService = require('../services/algoliaService');

async function testAlgoliaConnection() {
  try {
    console.log('🔍 Testing Algolia connection...');
    
    if (!algoliaService.isConfigured()) {
      console.error('❌ Algolia is not configured. Check your environment variables.');
      return;
    }
    
    console.log('✅ Algolia service is configured');
    console.log('App ID:', process.env.ALGOLIA_APP_ID);
    console.log('Index Name:', process.env.ALGOLIA_INDEX_NAME);
    
    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Fetch existing notes
    console.log('\n📝 Fetching existing notes...');
    const notes = await Note.find({ is_public: true })
      .populate('author', 'username displayName display_name university verified')
      .populate('community', 'name displayName display_name subject')
      .limit(10); // Limit to 10 for testing
    
    console.log(`Found ${notes.length} public notes`);
    
    if (notes.length === 0) {
      console.log('No notes found to sync');
      return;
    }
    
    // Test saving a single note to Algolia
    console.log('\n🔄 Testing single note sync...');
    const testNote = notes[0];
    const result = await algoliaService.saveNote(testNote);
    
    if (result) {
      console.log('✅ Successfully saved note to Algolia:', result.objectID);
    } else {
      console.log('❌ Failed to save note to Algolia');
    }
    
    // Test search with actual note content
    console.log('\n🔍 Testing search functionality...');
    console.log('Testing search with first note title:', testNote.title);
    
    // Search for the actual title
    const titleSearchResult = await algoliaService.searchNotes(testNote.title, { limit: 5 });
    
    if (titleSearchResult) {
      console.log(`✅ Title search successful. Found ${titleSearchResult.totalHits} results`);
      console.log('First result:', titleSearchResult.hits[0]?.title || 'No results');
    } else {
      console.log('❌ Title search failed');
    }
    
    // Search for common words
    const commonSearchResult = await algoliaService.searchNotes('note', { limit: 5 });
    
    if (commonSearchResult) {
      console.log(`✅ Common word search successful. Found ${commonSearchResult.totalHits} results`);
      console.log('First result:', commonSearchResult.hits[0]?.title || 'No results');
    } else {
      console.log('❌ Common word search failed');
    }
    
    // Search for empty query (should return all)
    const allSearchResult = await algoliaService.searchNotes('', { limit: 5 });
    
    if (allSearchResult) {
      console.log(`✅ Empty search successful. Found ${allSearchResult.totalHits} results`);
    } else {
      console.log('❌ Empty search failed');
    }

    // Test posts syncing
    console.log('\n📰 Testing posts syncing...');
    const posts = await Post.find()
      .populate('author', 'username displayName display_name university verified')
      .populate('community', 'name displayName display_name subject')
      .limit(5);

    console.log(`Found ${posts.length} posts`);

    if (posts.length > 0) {
      const testPost = posts[0];
      const postResult = await algoliaService.savePost(testPost);
      
      if (postResult) {
        console.log('✅ Successfully saved post to Algolia:', postResult.objectID);
      } else {
        console.log('❌ Failed to save post to Algolia');
      }

      // Test post search
      const postSearchResult = await algoliaService.searchPosts('test', { limit: 5 });
      
      if (postSearchResult) {
        console.log(`✅ Post search successful. Found ${postSearchResult.totalHits} results`);
        console.log('First post result:', postSearchResult.hits[0]?.title || 'No results');
      } else {
        console.log('❌ Post search failed');
      }
    }
    
    console.log('\n🎉 Algolia connection test completed!');
    
  } catch (error) {
    console.error('❌ Error testing Algolia connection:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

async function syncAllNotes() {
  try {
    console.log('🚀 Starting full sync to Algolia...');
    
    if (!algoliaService.isConfigured()) {
      console.error('❌ Algolia is not configured. Check your environment variables.');
      return;
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Sync Notes
    console.log('\n📝 Syncing notes...');
    const notes = await Note.find({ is_public: true })
      .populate('author', 'username displayName display_name university verified')
      .populate('community', 'name displayName display_name subject');
    
    console.log(`Found ${notes.length} public notes to sync`);
    
    if (notes.length > 0) {
      // Sync in batches of 100
      const batchSize = 100;
      for (let i = 0; i < notes.length; i += batchSize) {
        const batch = notes.slice(i, i + batchSize);
        console.log(`🔄 Syncing notes batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(notes.length / batchSize)} (${batch.length} notes)`);
        
        const result = await algoliaService.bulkUpdateNotes(batch);
        if (result) {
          console.log(`✅ Notes batch ${Math.floor(i / batchSize) + 1} synced successfully`);
        } else {
          console.log(`❌ Notes batch ${Math.floor(i / batchSize) + 1} failed`);
        }
      }
    }

    // Sync Posts
    console.log('\n📰 Syncing posts...');
    const posts = await Post.find()
      .populate('author', 'username displayName display_name university verified')
      .populate('community', 'name displayName display_name subject');
    
    console.log(`Found ${posts.length} posts to sync`);
    
    if (posts.length > 0) {
      // Sync in batches of 100
      const batchSize = 100;
      for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize);
        console.log(`🔄 Syncing posts batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(posts.length / batchSize)} (${batch.length} posts)`);
        
        const result = await algoliaService.bulkUpdatePosts(batch);
        if (result) {
          console.log(`✅ Posts batch ${Math.floor(i / batchSize) + 1} synced successfully`);
        } else {
          console.log(`❌ Posts batch ${Math.floor(i / batchSize) + 1} failed`);
        }
      }
    }
    
    console.log('🎉 Full sync completed!');
    
  } catch (error) {
    console.error('❌ Error syncing notes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'sync') {
  syncAllNotes();
} else {
  testAlgoliaConnection();
}
