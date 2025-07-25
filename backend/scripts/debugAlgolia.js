require('dotenv').config();
const algoliasearch = require('algoliasearch');

async function debugAlgolia() {
  try {
    const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_API_KEY);
    const notesIndex = client.initIndex('notes');
    const postsIndex = client.initIndex('posts');

    console.log('🔍 Debugging Algolia indices...\n');

    // Check notes index
    console.log('📝 Notes Index:');
    const notesResult = await notesIndex.search('', { 
      hitsPerPage: 10,
      attributesToRetrieve: ['objectID', 'title', 'is_public', 'author', 'community']
    });
    
    console.log(`Total notes: ${notesResult.nbHits}`);
    if (notesResult.hits.length > 0) {
      console.log('Sample notes:');
      notesResult.hits.forEach((hit, index) => {
        console.log(`  ${index + 1}. "${hit.title}" (public: ${hit.is_public}) - ID: ${hit.objectID}`);
      });
    }

    // Test search with different queries
    console.log('\n🔍 Testing searches:');
    
    // Search without filters
    const searchNoFilter = await notesIndex.search('', { hitsPerPage: 5 });
    console.log(`Search "" (no filters): ${searchNoFilter.nbHits} results`);
    
    // Search with public filter
    const searchWithFilter = await notesIndex.search('', { 
      hitsPerPage: 5,
      filters: 'is_public:true'
    });
    console.log(`Search "" (with is_public:true): ${searchWithFilter.nbHits} results`);
    
    // Search for specific title
    if (notesResult.hits.length > 0) {
      const firstNote = notesResult.hits[0];
      const titleSearch = await notesIndex.search(firstNote.title, { hitsPerPage: 5 });
      console.log(`Search "${firstNote.title}": ${titleSearch.nbHits} results`);
    }

    // Check posts index
    console.log('\n📰 Posts Index:');
    const postsResult = await postsIndex.search('', { 
      hitsPerPage: 10,
      attributesToRetrieve: ['objectID', 'title', 'type', 'author']
    });
    
    console.log(`Total posts: ${postsResult.nbHits}`);
    if (postsResult.hits.length > 0) {
      console.log('Sample posts:');
      postsResult.hits.forEach((hit, index) => {
        console.log(`  ${index + 1}. "${hit.title}" (type: ${hit.type}) - ID: ${hit.objectID}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugAlgolia();
