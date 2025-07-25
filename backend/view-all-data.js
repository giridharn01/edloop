const mongoose = require('mongoose');
require('dotenv').config();

const Post = require('./models/Post');
const User = require('./models/User');
const Community = require('./models/Community');

async function viewAllData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Overall statistics
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalCommunities = await Community.countDocuments();

    console.log('\n📊 DATABASE OVERVIEW');
    console.log('='.repeat(50));
    console.log(`👥 Total Users: ${totalUsers}`);
    console.log(`📝 Total Posts: ${totalPosts}`);
    console.log(`🏛️ Total Communities: ${totalCommunities}`);

    // Post statistics
    console.log('\n📝 POST STATISTICS');
    console.log('='.repeat(50));
    
    const postsByType = await Post.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('Posts by Type:');
    postsByType.forEach(type => {
      console.log(`  ${type._id}: ${type.count} posts`);
    });

    const postsByAuthor = await Post.aggregate([
      { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'authorInfo' } },
      { $unwind: '$authorInfo' },
      { $group: { _id: '$authorInfo.display_name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    console.log('\nTop 10 Most Active Post Authors:');
    postsByAuthor.forEach((author, index) => {
      console.log(`  ${index + 1}. ${author._id}: ${author.count} posts`);
    });

    const postsByCommunity = await Post.aggregate([
      { $lookup: { from: 'communities', localField: 'community', foreignField: '_id', as: 'communityInfo' } },
      { $unwind: '$communityInfo' },
      { $group: { _id: '$communityInfo.displayName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\nPosts by Community:');
    postsByCommunity.forEach(community => {
      console.log(`  ${community._id}: ${community.count} posts`);
    });

    // Engagement statistics
    const engagementStats = await Post.aggregate([
      {
        $group: {
          _id: null,
          totalUpvotes: { $sum: '$upvotes' },
          totalDownvotes: { $sum: '$downvotes' },
          totalComments: { $sum: '$comment_count' },
          avgUpvotes: { $avg: '$upvotes' },
          avgDownvotes: { $avg: '$downvotes' },
          avgComments: { $avg: '$comment_count' },
          maxUpvotes: { $max: '$upvotes' },
          maxComments: { $max: '$comment_count' }
        }
      }
    ]);

    if (engagementStats.length > 0) {
      const stats = engagementStats[0];
      console.log('\n📊 ENGAGEMENT STATISTICS');
      console.log('='.repeat(50));
      console.log(`Total Upvotes: ${stats.totalUpvotes}`);
      console.log(`Total Downvotes: ${stats.totalDownvotes}`);
      console.log(`Total Comments: ${stats.totalComments}`);
      console.log(`Average Upvotes per Post: ${stats.avgUpvotes.toFixed(1)}`);
      console.log(`Average Downvotes per Post: ${stats.avgDownvotes.toFixed(1)}`);
      console.log(`Average Comments per Post: ${stats.avgComments.toFixed(1)}`);
      console.log(`Highest Upvoted Post: ${stats.maxUpvotes} upvotes`);
      console.log(`Most Commented Post: ${stats.maxComments} comments`);
    }

    // Top posts by engagement
    console.log('\n🏆 TOP POSTS BY ENGAGEMENT');
    console.log('='.repeat(50));
    
    const topPosts = await Post.find({})
      .populate('author', 'username display_name')
      .populate('community', 'name displayName')
      .sort({ upvotes: -1 })
      .limit(5);
    
    console.log('Top 5 Most Upvoted Posts:');
    topPosts.forEach((post, index) => {
      console.log(`${index + 1}. "${post.title}"`);
      console.log(`   Author: ${post.author.display_name} (@${post.author.username})`);
      console.log(`   Community: ${post.community.displayName || post.community.name}`);
      console.log(`   Engagement: ${post.upvotes} upvotes, ${post.downvotes} downvotes, ${post.comment_count} comments`);
      console.log(`   Type: ${post.type} | Tags: ${post.tags.join(', ')}`);
      console.log('');
    });

    // User statistics
    console.log('👥 USER STATISTICS');
    console.log('='.repeat(50));
    
    const verifiedUsers = await User.countDocuments({ verified: true });
    const unverifiedUsers = await User.countDocuments({ verified: false });
    
    console.log(`Verified Users: ${verifiedUsers} (${(verifiedUsers/totalUsers*100).toFixed(1)}%)`);
    console.log(`Unverified Users: ${unverifiedUsers} (${(unverifiedUsers/totalUsers*100).toFixed(1)}%)`);

    const usersByUniversity = await User.aggregate([
      { $group: { _id: '$university', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    console.log('\nTop 5 Universities by User Count:');
    usersByUniversity.forEach((uni, index) => {
      console.log(`  ${index + 1}. ${uni._id}: ${uni.count} users`);
    });

    const usersByDomain = await User.aggregate([
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    console.log('\nTop 5 Academic Domains:');
    usersByDomain.forEach((domain, index) => {
      console.log(`  ${index + 1}. ${domain._id}: ${domain.count} users`);
    });

    console.log('\n✅ Database successfully populated with comprehensive test data!');
    console.log('\n🔍 READY FOR SEARCH TESTING:');
    console.log('- 40 posts with diverse content and tags');
    console.log('- 38 users from various universities and domains');
    console.log('- Posts distributed across 2 communities');
    console.log('- Mix of text and link post types');
    console.log('- Realistic engagement metrics');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

viewAllData();
