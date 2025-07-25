const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to register them
const User = require('./models/User');
const Community = require('./models/Community');
const Post = require('./models/Post');
const Note = require('./models/Note');
const algoliaService = require('./services/algoliaService');

async function syncPostsToAlgolia() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check if Algolia is configured
    if (!algoliaService.isConfigured()) {
      console.log('❌ Algolia not configured. Please check your environment variables.');
      await mongoose.disconnect();
      return;
    }
    
    console.log('✅ Algolia is configured');
    
    // Get all posts without population first to avoid schema errors
    const posts = await Post.find({});
    console.log(`📊 Found ${posts.length} posts in database`);
    
    if (posts.length === 0) {
      console.log('ℹ️ No posts found to sync');
      await mongoose.disconnect();
      return;
    }
    
    // Sync each post to Algolia
    let successCount = 0;
    for (const post of posts) {
      try {
        console.log(`📄 Processing: "${post.title}" - Tags: [${post.tags?.join(', ') || 'none'}]`);
        
        // Create a simplified object for Algolia
        const algoliaObject = {
          objectID: post._id.toString(),
          title: post.title,
          content: post.content,
          type: 'post',
          tags: post.tags || [],
          upvotes: post.upvotes || 0,
          downvotes: post.downvotes || 0,
          createdAt: post.createdAt,
          author: post.author?.toString() || 'Unknown',
          community: post.community?.toString() || 'Unknown'
        };
        
        await algoliaService.savePost(algoliaObject);
        console.log(`   ✅ Saved to Algolia`);
        successCount++;
        
      } catch (error) {
        console.error(`   ❌ Error saving post "${post.title}":`, error.message);
      }
    }
    
    console.log(`\n🎉 Successfully synced ${successCount}/${posts.length} posts to Algolia`);
    
    // Test search after sync
    console.log('\n🔍 Testing search after sync...');
    const searchResult = await algoliaService.searchPosts('english');
    console.log(`Search for "english": ${searchResult?.hits?.length || 0} results`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    await mongoose.disconnect();
  }
}

syncPostsToAlgolia();
