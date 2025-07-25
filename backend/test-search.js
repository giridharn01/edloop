const mongoose = require('mongoose');
const Note = require('./models/Note');
const Post = require('./models/Post');
require('dotenv').config();

async function testSearch() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // First, let's see what data we have
    const totalNotes = await Note.countDocuments();
    const totalPosts = await Post.countDocuments();
    console.log(`\n� Database Stats:`);
    console.log(`Total Notes: ${totalNotes}`);
    console.log(`Total Posts: ${totalPosts}`);

    // Get a sample of notes to see what fields we have
    console.log('\n📝 Sample Notes:');
    const sampleNotes = await Note.find({}).limit(3);
    sampleNotes.forEach((note, index) => {
      console.log(`${index + 1}. "${note.title}"`);
      console.log(`   Subject: ${note.subject} | Tags: ${note.tags?.join(', ') || 'None'}`);
      console.log(`   Attachments: ${note.attachments?.length || 0}`);
    });

    // Get a sample of posts to see what fields we have
    console.log('\n📰 Sample Posts:');
    const samplePosts = await Post.find({}).limit(3);
    samplePosts.forEach((post, index) => {
      console.log(`${index + 1}. "${post.title}"`);
      console.log(`   Type: ${post.type} | Tags: ${post.tags?.join(', ') || 'None'}`);
      console.log(`   Note File: ${post.note_file ? post.note_file.name : 'None'}`);
    });

    // Test search with a common word
    const searchQueries = ['computer', 'study', 'notes', 'science'];
    
    for (const searchQuery of searchQueries) {
      const searchRegex = new RegExp(searchQuery, 'i');
      console.log(`\n🔍 Testing search for: "${searchQuery}"`);
      console.log('='.repeat(40));

      // Test Notes search
      const notesFilter = {
        is_public: true,
        $or: [
          { title: { $regex: searchRegex } },
          { content: { $regex: searchRegex } },
          { subject: { $regex: searchRegex } },
          { tags: { $in: [searchRegex] } },
          { 'attachments.name': { $regex: searchRegex } },
          { 'attachments.type': { $regex: searchRegex } }
        ]
      };

      const notes = await Note.find(notesFilter).limit(2);
      console.log(`📝 Found ${notes.length} notes matching "${searchQuery}"`);

      // Test Posts search
      const postsFilter = {
        $or: [
          { title: { $regex: searchRegex } },
          { content: { $regex: searchRegex } },
          { tags: { $in: [searchRegex] } },
          { 'note_file.name': { $regex: searchRegex } },
          { 'note_file.type': { $regex: searchRegex } }
        ]
      };

      const posts = await Post.find(postsFilter).limit(2);
      console.log(`📰 Found ${posts.length} posts matching "${searchQuery}"`);
      
      if (notes.length > 0 || posts.length > 0) {
        console.log('✅ Search is working for this term!');
        break; // Found working search, exit loop
      }
    }

    console.log('\n✅ Search test completed!');
    
  } catch (error) {
    console.error('❌ Search test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testSearch();
