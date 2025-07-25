const mongoose = require('mongoose');
require('dotenv').config();

const Group = require('./models/Group');
const User = require('./models/User');
const algoliaService = require('./services/algoliaService');

async function createTestGroup() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a user to be the creator
    const user = await User.findOne();
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`👤 Using user: ${user.username} as group creator`);

    // Create a test group
    const testGroup = new Group({
      name: 'Computer Science Study Group',
      description: 'A group for computer science students to share notes, discuss topics, and collaborate on projects.',
      category: 'Computer Science',
      type: 'study',
      isPrivate: false,
      creator: user._id,
      members: [{
        user: user._id,
        role: 'admin',
        joinedAt: new Date()
      }],
      settings: {
        allowNoteSharing: true,
        allowDiscussions: true,
        requireApproval: false
      }
    });

    console.log('💾 Saving test group to MongoDB...');
    const savedGroup = await testGroup.save();
    console.log(`✅ Test group saved with ID: ${savedGroup._id}`);

    // Push to Algolia
    console.log('📤 Pushing test group to Algolia...');
    await algoliaService.saveGroup(savedGroup);
    console.log('✅ Test group pushed to Algolia');

    // Test search
    console.log('\n🔍 Testing groups search...');
    const searchResults = await algoliaService.searchGroups('computer');
    console.log(`✅ Found ${searchResults.hits.length} groups`);
    
    if (searchResults.hits.length > 0) {
      console.log('Sample results:');
      searchResults.hits.forEach((group, index) => {
        console.log(`   ${index + 1}. "${group.name}" - Type: ${group.type}`);
        console.log(`      Description: ${group.description}`);
      });
    }

    console.log('\n🎉 Group functionality test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createTestGroup();
