const algoliasearch = require('algoliasearch');
require('dotenv').config();

async function testAlgoliaConnection() {
  console.log('🔍 Testing Algolia Connection...');
  
  const client = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_API_KEY
  );
  
  const notesIndex = client.initIndex('notes');
  const postsIndex = client.initIndex('posts');
  
  try {
    // Test search in notes index
    console.log('\n📝 Testing notes index...');
    console.log('App ID:', process.env.ALGOLIA_APP_ID);
    console.log('API Key exists:', !!process.env.ALGOLIA_API_KEY);
    
    const notesResult = await notesIndex.search('computer');
    console.log('Notes search result for "computer":', notesResult.hits.length, 'results');
    
    if (notesResult.hits.length > 0) {
      console.log('First note result:', notesResult.hits[0].title);
    }
    
    // Test search in posts index
    console.log('\n📄 Testing posts index...');
    const postsResult = await postsIndex.search('computer');
    console.log('Posts search result for "computer":', postsResult.hits.length, 'results');
    
    if (postsResult.hits.length > 0) {
      console.log('First post result:', postsResult.hits[0].title);
    }
    
    // Test getting index stats
    console.log('\n📊 Getting index stats...');
    const notesStats = await notesIndex.getSettings();
    console.log('Notes index settings retrieved successfully');
    
    const postsStats = await postsIndex.getSettings();
    console.log('Posts index settings retrieved successfully');
    
  } catch (error) {
    console.error('❌ Algolia error:', error.message);
    console.error('Full error:', error);
  }
}

testAlgoliaConnection();
