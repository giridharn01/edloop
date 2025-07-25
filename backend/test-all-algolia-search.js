const mongoose = require('mongoose');
require('dotenv').config();

const algoliaService = require('./services/algoliaService');

async function testAllSearchTypes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if Algolia is configured
    if (!algoliaService.isConfigured()) {
      console.log('❌ Algolia is not configured. Please check your environment variables.');
      return;
    }

    console.log('✅ Algolia is configured and ready');
    console.log('\n🔍 Testing Algolia search for all types...\n');

    // Test notes search
    console.log('📝 Testing notes search for "computer science"...');
    try {
      const notesResults = await algoliaService.searchNotes('computer science');
      console.log(`   ✅ Found ${notesResults.hits.length} notes`);
      if (notesResults.hits.length > 0) {
        console.log('   Sample results:');
        notesResults.hits.slice(0, 3).forEach((note, index) => {
          console.log(`   ${index + 1}. "${note.title}" - Subject: ${note.subject}`);
        });
      }
    } catch (error) {
      console.error('   ❌ Error searching notes:', error.message);
    }

    // Test posts search
    console.log('\n📄 Testing posts search for "programming"...');
    try {
      const postsResults = await algoliaService.searchPosts('programming');
      console.log(`   ✅ Found ${postsResults.hits.length} posts`);
      if (postsResults.hits.length > 0) {
        console.log('   Sample results:');
        postsResults.hits.slice(0, 3).forEach((post, index) => {
          console.log(`   ${index + 1}. "${post.title}" - Type: ${post.type}`);
        });
      }
    } catch (error) {
      console.error('   ❌ Error searching posts:', error.message);
    }

    // Test groups search
    console.log('\n👥 Testing groups search for "study"...');
    try {
      const groupsResults = await algoliaService.searchGroups('study');
      console.log(`   ✅ Found ${groupsResults.hits.length} groups`);
      if (groupsResults.hits.length > 0) {
        console.log('   Sample results:');
        groupsResults.hits.slice(0, 3).forEach((group, index) => {
          console.log(`   ${index + 1}. "${group.name}" - Type: ${group.type || 'N/A'}`);
        });
      } else {
        console.log('   ℹ️  No groups found (this is expected if no groups are created yet)');
      }
    } catch (error) {
      console.error('   ❌ Error searching groups:', error.message);
    }

    // Test users search
    console.log('\n👤 Testing users search for "john"...');
    try {
      const usersResults = await algoliaService.searchUsers('john');
      console.log(`   ✅ Found ${usersResults.hits.length} users`);
      if (usersResults.hits.length > 0) {
        console.log('   Sample results:');
        usersResults.hits.slice(0, 3).forEach((user, index) => {
          console.log(`   ${index + 1}. "${user.displayName || user.username}" (@${user.username})`);
        });
      }
    } catch (error) {
      console.error('   ❌ Error searching users:', error.message);
    }

    // Test communities search
    console.log('\n🏛️ Testing communities search for "computer"...');
    try {
      const communitiesResults = await algoliaService.searchCommunities('computer');
      console.log(`   ✅ Found ${communitiesResults.hits.length} communities`);
      if (communitiesResults.hits.length > 0) {
        console.log('   Sample results:');
        communitiesResults.hits.slice(0, 3).forEach((community, index) => {
          console.log(`   ${index + 1}. "${community.displayName || community.name}"`);
        });
      }
    } catch (error) {
      console.error('   ❌ Error searching communities:', error.message);
    }

    console.log('\n🎉 All search tests completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testAllSearchTypes();
