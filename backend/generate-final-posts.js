const mongoose = require('mongoose');
require('dotenv').config();

const Post = require('./models/Post');
const User = require('./models/User');
const Community = require('./models/Community');

async function generateFinalPosts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const currentPostCount = await Post.countDocuments();
    console.log(`📊 Current posts in database: ${currentPostCount}`);
    
    const postsNeeded = Math.max(0, 40 - currentPostCount);
    console.log(`📝 Need to generate ${postsNeeded} more posts to reach 40 total`);

    if (postsNeeded === 0) {
      console.log('✅ Already have 40 or more posts!');
      return;
    }

    const users = await User.find({}, '_id username display_name');
    const communities = await Community.find({}, '_id name displayName');

    const finalPostTitles = [
      "Quantum physics study group formation",
      "Web development bootcamp review",
      "Chemistry lab safety protocols",
      "Mathematics competition preparation"
    ];

    const finalContents = [
      "Looking to form a study group for quantum physics. We'll meet weekly to discuss complex concepts and work through problem sets together.",
      "I recently completed a web development bootcamp and want to share my honest review and recommendations for future students.",
      "Safety in the chemistry lab is crucial. Here's a comprehensive guide to proper procedures and emergency protocols.",
      "Preparing for the upcoming mathematics competition. Let's share problem-solving strategies and practice together."
    ];

    const finalTags = [
      ['quantum', 'physics', 'study-group'],
      ['web-development', 'bootcamp', 'review'],
      ['chemistry', 'lab-safety', 'protocols'],
      ['mathematics', 'competition', 'preparation']
    ];

    console.log(`💾 Creating ${Math.min(postsNeeded, finalPostTitles.length)} final posts...`);

    let insertedCount = 0;
    for (let i = 0; i < Math.min(postsNeeded, finalPostTitles.length); i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomCommunity = communities[Math.floor(Math.random() * communities.length)];
      
      // Only use 'text' and 'link' types to avoid note_file validation issues
      const safeTypes = ['text', 'link'];
      const randomType = safeTypes[Math.floor(Math.random() * safeTypes.length)];
      
      const postData = {
        title: finalPostTitles[i],
        content: finalContents[i],
        type: randomType,
        author: randomUser._id,
        community: randomCommunity._id,
        upvotes: Math.floor(Math.random() * 50),
        downvotes: Math.floor(Math.random() * 10),
        comment_count: Math.floor(Math.random() * 25),
        tags: finalTags[i],
        is_pinned: false,
        is_locked: false
      };

      // Only add link_url for link type posts
      if (randomType === 'link') {
        const linkUrls = [
          'https://www.mit.edu/courses/physics/quantum-mechanics',
          'https://www.udemy.com/course/web-development',
          'https://www.acs.org/content/acs/en/chemical-safety',
          'https://www.mathcompetition.org/resources'
        ];
        postData.link_url = linkUrls[i % linkUrls.length];
      }

      try {
        const post = new Post(postData);
        await post.save();
        insertedCount++;
        console.log(`✅ Inserted "${postData.title}" (${postData.type})`);
      } catch (error) {
        console.error(`❌ Error inserting post "${postData.title}":`, error.message);
      }
    }

    const finalPostCount = await Post.countDocuments();
    console.log(`🎉 Successfully inserted ${insertedCount} final posts!`);
    console.log(`📊 Total posts in database: ${finalPostCount}`);

    // Final statistics
    console.log('\n📊 Final Post Statistics:');
    
    const postsByType = await Post.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('📝 Posts by Type:');
    postsByType.forEach(type => {
      console.log(`  ${type._id}: ${type.count} posts`);
    });

    const pinnedPosts = await Post.countDocuments({ is_pinned: true });
    const lockedPosts = await Post.countDocuments({ is_locked: true });
    console.log(`📌 Pinned posts: ${pinnedPosts}`);
    console.log(`🔒 Locked posts: ${lockedPosts}`);

    // Show most recent posts
    console.log('\n📋 Most Recent Posts:');
    const recentPosts = await Post.find({})
      .populate('author', 'username display_name')
      .populate('community', 'name displayName')
      .sort({ createdAt: -1 })
      .limit(5);
    
    recentPosts.forEach((post, index) => {
      console.log(`${index + 1}. "${post.title}"`);
      console.log(`   Type: ${post.type} | Author: ${post.author.display_name} (@${post.author.username})`);
      console.log(`   Community: ${post.community.displayName || post.community.name}`);
      console.log(`   Engagement: ${post.upvotes} upvotes, ${post.comment_count} comments`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

generateFinalPosts();
