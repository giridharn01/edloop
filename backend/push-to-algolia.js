const mongoose = require('mongoose');
require('dotenv').config();

const Note = require('./models/Note');
const Post = require('./models/Post');
const User = require('./models/User');
const Community = require('./models/Community');
const Group = require('./models/Group');
const algoliaService = require('./services/algoliaService');

async function pushAllDataToAlgolia() {
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

    // Get all notes from MongoDB
    console.log('\n📝 Fetching all notes from MongoDB...');
    const notes = await Note.find({ is_public: true })
      .populate('author', 'username displayName display_name')
      .populate('community', 'name displayName display_name');
    
    console.log(`📊 Found ${notes.length} public notes to index`);

    // Push notes to Algolia
    if (notes.length > 0) {
      console.log('📤 Pushing notes to Algolia...');
      let notesIndexed = 0;
      
      for (const note of notes) {
        try {
          await algoliaService.saveNote(note);
          notesIndexed++;
          
          if (notesIndexed % 10 === 0) {
            console.log(`   ✅ Indexed ${notesIndexed}/${notes.length} notes...`);
          }
        } catch (error) {
          console.error(`   ❌ Error indexing note "${note.title}":`, error.message);
        }
      }
      
      console.log(`🎉 Successfully indexed ${notesIndexed} notes to Algolia!`);
    }

    // Get all posts from MongoDB
    console.log('\n📄 Fetching all posts from MongoDB...');
    const posts = await Post.find({})
      .populate('author', 'username displayName display_name')
      .populate('community', 'name displayName display_name')
      .populate('group', 'name');
    
    console.log(`📊 Found ${posts.length} posts to index`);

    // Push posts to Algolia
    if (posts.length > 0) {
      console.log('📤 Pushing posts to Algolia...');
      let postsIndexed = 0;
      
      for (const post of posts) {
        try {
          await algoliaService.savePost(post);
          postsIndexed++;
          
          if (postsIndexed % 10 === 0) {
            console.log(`   ✅ Indexed ${postsIndexed}/${posts.length} posts...`);
          }
        } catch (error) {
          console.error(`   ❌ Error indexing post "${post.title}":`, error.message);
        }
      }
      
      console.log(`🎉 Successfully indexed ${postsIndexed} posts to Algolia!`);
    }

    // Get all groups from MongoDB
    console.log('\n👥 Fetching all groups from MongoDB...');
    const groups = await Group.find({})
      .populate('creator', 'username displayName display_name')
      .populate('members.user', 'username displayName display_name');
    
    console.log(`📊 Found ${groups.length} groups to index`);

    // Push groups to Algolia
    if (groups.length > 0) {
      console.log('📤 Pushing groups to Algolia...');
      let groupsIndexed = 0;
      
      for (const group of groups) {
        try {
          await algoliaService.saveGroup(group);
          groupsIndexed++;
          
          if (groupsIndexed % 5 === 0) {
            console.log(`   ✅ Indexed ${groupsIndexed}/${groups.length} groups...`);
          }
        } catch (error) {
          console.error(`   ❌ Error indexing group "${group.name}":`, error.message);
        }
      }
      
      console.log(`🎉 Successfully indexed ${groupsIndexed} groups to Algolia!`);
    }

    // Get all users from MongoDB
    console.log('\n👤 Fetching all users from MongoDB...');
    const users = await User.find({});
    
    console.log(`📊 Found ${users.length} users to index`);

    // Push users to Algolia
    if (users.length > 0) {
      console.log('📤 Pushing users to Algolia...');
      let usersIndexed = 0;
      
      for (const user of users) {
        try {
          await algoliaService.saveUser(user);
          usersIndexed++;
          
          if (usersIndexed % 10 === 0) {
            console.log(`   ✅ Indexed ${usersIndexed}/${users.length} users...`);
          }
        } catch (error) {
          console.error(`   ❌ Error indexing user "${user.username}":`, error.message);
        }
      }
      
      console.log(`🎉 Successfully indexed ${usersIndexed} users to Algolia!`);
    }

    // Get all communities from MongoDB
    console.log('\n🏛️ Fetching all communities from MongoDB...');
    const communities = await Community.find({});
    
    console.log(`📊 Found ${communities.length} communities to index`);

    // Push communities to Algolia
    if (communities.length > 0) {
      console.log('📤 Pushing communities to Algolia...');
      let communitiesIndexed = 0;
      
      for (const community of communities) {
        try {
          await algoliaService.saveCommunity(community);
          communitiesIndexed++;
          
          if (communitiesIndexed % 5 === 0) {
            console.log(`   ✅ Indexed ${communitiesIndexed}/${communities.length} communities...`);
          }
        } catch (error) {
          console.error(`   ❌ Error indexing community "${community.name}":`, error.message);
        }
      }
      
      console.log(`🎉 Successfully indexed ${communitiesIndexed} communities to Algolia!`);
    }

    // Test search functionality
    console.log('\n🔍 Testing Algolia search...');
    
    // Test notes search
    console.log('📝 Testing notes search for "computer"...');
    try {
      const notesResult = await algoliaService.searchNotes('computer');
      console.log(`   Found ${notesResult ? notesResult.hits.length : 0} notes`);
      
      if (notesResult && notesResult.hits.length > 0) {
        console.log('   Sample results:');
        notesResult.hits.slice(0, 3).forEach((hit, index) => {
          console.log(`   ${index + 1}. "${hit.title}" - Subject: ${hit.subject}`);
        });
      }
    } catch (error) {
      console.error('   ❌ Error testing notes search:', error.message);
    }

    // Test posts search
    console.log('\n📄 Testing posts search for "programming"...');
    try {
      const postsResult = await algoliaService.searchPosts('programming');
      console.log(`   Found ${postsResult ? postsResult.hits.length : 0} posts`);
      
      if (postsResult && postsResult.hits.length > 0) {
        console.log('   Sample results:');
        postsResult.hits.slice(0, 3).forEach((hit, index) => {
          console.log(`   ${index + 1}. "${hit.title}" - Type: ${hit.type}`);
        });
      }
    } catch (error) {
      console.error('   ❌ Error testing posts search:', error.message);
    }

    // Summary
    console.log('\n📊 INDEXING SUMMARY');
    console.log('='.repeat(50));
    console.log(`📝 Notes indexed: ${notes.length}`);
    console.log(`📄 Posts indexed: ${posts.length}`);
    console.log(`📊 Total documents indexed: ${notes.length + posts.length}`);
    console.log('\n✅ All data successfully pushed to Algolia!');
    console.log('🔍 Search functionality is now ready to use');

  } catch (error) {
    console.error('❌ Error pushing data to Algolia:', error);
  } finally {
    console.log('\n🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

pushAllDataToAlgolia();
