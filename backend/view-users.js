const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function viewUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const totalUsers = await User.countDocuments();
    console.log(`\n📊 Total users in database: ${totalUsers}`);

    // Get users by university
    console.log('\n🏫 Users by University:');
    const usersByUniversity = await User.aggregate([
      { $group: { _id: '$university', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    usersByUniversity.forEach(uni => {
      console.log(`  ${uni._id}: ${uni.count} users`);
    });

    // Get users by domain
    console.log('\n📚 Users by Domain:');
    const usersByDomain = await User.aggregate([
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    usersByDomain.forEach(domain => {
      console.log(`  ${domain._id}: ${domain.count} users`);
    });

    // Verification stats
    const verifiedCount = await User.countDocuments({ verified: true });
    const unverifiedCount = await User.countDocuments({ verified: false });
    console.log(`\n✅ Verification Status:`);
    console.log(`  Verified: ${verifiedCount} users`);
    console.log(`  Unverified: ${unverifiedCount} users`);

    // Top karma users
    console.log('\n🏆 Top 10 Users by Karma:');
    const topKarmaUsers = await User.find({}, 'display_name username karma university verified')
      .sort({ karma: -1 })
      .limit(10);
    
    topKarmaUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.display_name} (@${user.username}) - ${user.karma} karma`);
      console.log(`     ${user.university} ${user.verified ? '✓' : '✗'}`);
    });

    // Recent users
    console.log('\n🆕 Most Recent 5 Users:');
    const recentUsers = await User.find({}, 'display_name username university domain createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    recentUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.display_name} (@${user.username})`);
      console.log(`     ${user.university} - ${user.domain}`);
      console.log(`     Joined: ${user.createdAt.toLocaleDateString()}`);
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

viewUsers();
