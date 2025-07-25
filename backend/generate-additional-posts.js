const mongoose = require('mongoose');
require('dotenv').config();

const Post = require('./models/Post');
const User = require('./models/User');
const Community = require('./models/Community');

// Additional post titles to reach 40 total
const additionalPostTitles = [
  "Advanced calculus problem solving techniques",
  "Machine learning fundamentals for beginners",
  "Study tips for finals week preparation",
  "Research paper writing methodology",
  "Programming interview preparation guide",
  "Statistics for social science research",
  "Creative writing workshop announcement",
  "Lab equipment usage and safety guidelines",
  "Digital marketing strategies for students",
  "Environmental science field trip report",
  "Music theory composition exercises",
  "Art history presentation techniques",
  "Philosophy debate club discussion topics",
  "Engineering design project showcase",
  "Foreign language learning resources",
  "Accounting principles study materials",
  "Sports science nutrition guidelines",
  "Theater performance audition tips"
];

const additionalContents = [
  "I've developed a systematic approach to solving these types of problems. Let me share the step-by-step methodology that has helped me succeed.",
  
  "Starting your journey in this field can be overwhelming. Here's a beginner-friendly roadmap with practical examples and exercises.",
  
  "Finals week is approaching fast! I've compiled the most effective study strategies that have helped me maintain high grades.",
  
  "After writing multiple research papers, I've learned some valuable lessons about structure, citations, and argumentation.",
  
  "Having recently completed several technical interviews, I want to share the preparation strategies that worked best for me.",
  
  "Understanding statistical concepts is crucial for research. This guide breaks down complex topics into digestible explanations.",
  
  "Join us for a creative writing workshop where we'll explore different genres and improve our storytelling techniques together.",
  
  "Safety in the laboratory is paramount. Here's a comprehensive checklist to ensure proper equipment usage and emergency procedures.",
  
  "Digital marketing skills are increasingly valuable. I'll share practical strategies that students can use to build their online presence.",
  
  "Our recent field trip provided incredible insights into local ecosystems. Here are the key observations and learning outcomes."
];

const additionalTags = [
  ['advanced', 'calculus', 'problem-solving'],
  ['machine-learning', 'ai', 'beginners'],
  ['finals', 'study-tips', 'exam-prep'],
  ['research', 'writing', 'methodology'],
  ['programming', 'interviews', 'career'],
  ['statistics', 'research', 'social-science'],
  ['creative-writing', 'workshop', 'literature'],
  ['lab-safety', 'equipment', 'guidelines'],
  ['marketing', 'digital', 'business'],
  ['environmental', 'field-trip', 'science'],
  ['music', 'theory', 'composition'],
  ['art', 'history', 'presentation'],
  ['philosophy', 'debate', 'discussion'],
  ['engineering', 'design', 'project'],
  ['languages', 'learning', 'resources'],
  ['accounting', 'finance', 'study'],
  ['sports', 'nutrition', 'health'],
  ['theater', 'audition', 'performance']
];

async function generateAdditionalPosts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check current post count
    const currentPostCount = await Post.countDocuments();
    console.log(`📊 Current posts in database: ${currentPostCount}`);
    
    const postsNeeded = Math.max(0, 40 - currentPostCount);
    console.log(`📝 Need to generate ${postsNeeded} more posts to reach 40 total`);
    
    if (postsNeeded === 0) {
      console.log('✅ Already have 40 or more posts!');
      return;
    }

    // Get all users and communities
    const users = await User.find({}, '_id username display_name');
    const communities = await Community.find({}, '_id name displayName');
    
    console.log(`👥 Using ${users.length} users and ${communities.length} communities`);

    const postTypes = ['text', 'link', 'note'];
    const posts = [];

    for (let i = 0; i < postsNeeded && i < additionalPostTitles.length; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomCommunity = communities[Math.floor(Math.random() * communities.length)];
      const randomType = postTypes[Math.floor(Math.random() * postTypes.length)];
      
      const post = {
        title: additionalPostTitles[i],
        content: additionalContents[i % additionalContents.length],
        type: randomType,
        author: randomUser._id,
        community: randomCommunity._id,
        upvotes: Math.floor(Math.random() * 50),
        downvotes: Math.floor(Math.random() * 10),
        comment_count: Math.floor(Math.random() * 25),
        tags: additionalTags[i % additionalTags.length],
        is_pinned: Math.random() > 0.95,
        is_locked: Math.random() > 0.98,
      };

      // Add type-specific fields only when needed
      if (randomType === 'link') {
        const linkUrls = [
          'https://www.khanacademy.org/math/advanced-calculus',
          'https://www.coursera.org/learn/machine-learning',
          'https://developer.mozilla.org/en-US/docs/Learn',
          'https://www.w3schools.com/js/',
          'https://www.freecodecamp.org/',
          'https://www.codecademy.com/',
          'https://medium.com/@author/article',
          'https://towards-data-science.com/',
          'https://www.youtube.com/watch?v=educational-video'
        ];
        post.link_url = linkUrls[Math.floor(Math.random() * linkUrls.length)];
      }
      
      if (randomType === 'note') {
        const noteFiles = [
          { name: 'advanced_calculus_notes.pdf', type: 'application/pdf', size: 2560000 },
          { name: 'ml_cheatsheet.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 1536000 },
          { name: 'research_methodology.pdf', type: 'application/pdf', size: 3584000 },
          { name: 'study_guide.txt', type: 'text/plain', size: 768000 },
          { name: 'lab_diagrams.png', type: 'image/png', size: 2048000 }
        ];
        const randomFile = noteFiles[Math.floor(Math.random() * noteFiles.length)];
        post.note_file = {
          name: randomFile.name,
          url: `/uploads/notes/${randomFile.name}`,
          type: randomFile.type,
          size: randomFile.size
        };
      }

      posts.push(post);
    }

    console.log(`💾 Inserting ${posts.length} additional posts...`);
    
    let insertedCount = 0;
    for (const postData of posts) {
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
    console.log(`🎉 Successfully inserted ${insertedCount} additional posts!`);
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

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

generateAdditionalPosts();
