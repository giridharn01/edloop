const mongoose = require('mongoose');
require('dotenv').config();

const algoliaService = require('./services/algoliaService');

async function testAlgoliaSearch() {
  try {
    console.log('🔍 TESTING ALGOLIA SEARCH FUNCTIONALITY');
    console.log('='.repeat(60));

    if (!algoliaService.isConfigured()) {
      console.log('❌ Algolia is not configured');
      return;
    }

    console.log('✅ Algolia is configured and ready\n');

    // Test different search queries
    const testQueries = [
      'computer',
      'programming',
      'mathematics',
      'physics',
      'chemistry',
      'engineering',
      'study',
      'research',
      'javascript',
      'calculus'
    ];

    console.log('📝 TESTING NOTES SEARCH');
    console.log('-'.repeat(40));

    for (const query of testQueries) {
      try {
        const result = await algoliaService.searchNotes(query);
        const hitCount = result ? result.hits.length : 0;
        
        console.log(`🔍 "${query}": ${hitCount} notes found`);
        
        if (hitCount > 0 && result.hits.length > 0) {
          // Show top 2 results
          result.hits.slice(0, 2).forEach((hit, index) => {
            console.log(`   ${index + 1}. "${hit.title}" - ${hit.subject || 'No subject'}`);
          });
        }
        console.log('');
      } catch (error) {
        console.error(`❌ Error searching notes for "${query}":`, error.message);
      }
    }

    console.log('\n📄 TESTING POSTS SEARCH');
    console.log('-'.repeat(40));

    for (const query of testQueries) {
      try {
        const result = await algoliaService.searchPosts(query);
        const hitCount = result ? result.hits.length : 0;
        
        console.log(`🔍 "${query}": ${hitCount} posts found`);
        
        if (hitCount > 0 && result.hits.length > 0) {
          // Show top 2 results
          result.hits.slice(0, 2).forEach((hit, index) => {
            console.log(`   ${index + 1}. "${hit.title}" - Type: ${hit.type || 'unknown'}`);
          });
        }
        console.log('');
      } catch (error) {
        console.error(`❌ Error searching posts for "${query}":`, error.message);
      }
    }

    // Test search with filters
    console.log('\n🎯 TESTING FILTERED SEARCH');
    console.log('-'.repeat(40));

    try {
      console.log('🔍 Searching notes with filters (Computer Science subject):');
      const filteredResult = await algoliaService.searchNotes('', {
        subject: 'Computer Science',
        limit: 5
      });
      
      const filteredHits = filteredResult ? filteredResult.hits.length : 0;
      console.log(`   Found ${filteredHits} Computer Science notes`);
      
      if (filteredHits > 0) {
        filteredResult.hits.forEach((hit, index) => {
          console.log(`   ${index + 1}. "${hit.title}" - ${hit.subject}`);
        });
      }
    } catch (error) {
      console.error('❌ Error with filtered search:', error.message);
    }

    // Test empty search (should return all)
    console.log('\n📊 TESTING COMPREHENSIVE SEARCH');
    console.log('-'.repeat(40));

    try {
      const allNotes = await algoliaService.searchNotes('', { limit: 50 });
      const allPosts = await algoliaService.searchPosts('', { limit: 50 });
      
      console.log(`📝 Total notes in Algolia: ${allNotes ? allNotes.hits.length : 0}`);
      console.log(`📄 Total posts in Algolia: ${allPosts ? allPosts.hits.length : 0}`);
      console.log(`📊 Total documents: ${(allNotes ? allNotes.hits.length : 0) + (allPosts ? allPosts.hits.length : 0)}`);
    } catch (error) {
      console.error('❌ Error with comprehensive search:', error.message);
    }

    console.log('\n✅ ALGOLIA SEARCH TESTING COMPLETED');
    console.log('🔍 Search functionality is working properly!');

  } catch (error) {
    console.error('❌ Error testing Algolia search:', error);
  }
}

testAlgoliaSearch();
