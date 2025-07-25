const mongoose = require('mongoose');
require('dotenv').config();

const Post = require('./models/Post');
const User = require('./models/User');
const Community = require('./models/Community');

// Sample post data
const postTitles = [
  // Academic/Study Posts
  "Need help with Calculus II derivatives",
  "Study group for upcoming Chemistry exam",
  "Computer Science algorithms explained simply",
  "Physics lab report guidelines",
  "Best resources for learning JavaScript",
  "Economics midterm prep session",
  "Biology cell structure study notes",
  "Mathematics proof techniques tutorial",
  "History research paper topics",
  "Psychology statistics help needed",
  
  // Discussion Posts
  "What's your favorite programming language and why?",
  "Best study techniques for memorization",
  "Campus life experiences - share yours!",
  "Internship opportunities in tech",
  "Graduate school application tips",
  "Time management strategies for students",
  "Online vs in-person classes debate",
  "Best textbooks for organic chemistry",
  "Research opportunities for undergrads",
  "Career advice for engineering students",
  
  // Question Posts
  "How to balance work and studies?",
  "What are the prerequisites for advanced math courses?",
  "Anyone else struggling with remote learning?",
  "Tips for effective note-taking?",
  "How to find research mentors?",
  "Best apps for student productivity",
  "Dealing with academic stress and anxiety",
  "Group project management strategies",
  "How to improve presentation skills?",
  "Study abroad program recommendations",
  
  // Resource Sharing
  "Sharing my comprehensive physics notes",
  "Free coding bootcamp resources compilation",
  "Essay writing guide for humanities students",
  "Laboratory safety protocols checklist",
  "Programming project ideas for beginners",
  "Academic writing tips and tricks",
  "Scholarship opportunities database",
  "Career fair preparation guide",
  "Interview preparation resources",
  "Academic calendar and important dates"
];

const postContents = [
  "I've been struggling with this concept for weeks now. Can someone explain it in simpler terms? I've tried multiple textbooks but still can't grasp the fundamentals.",
  
  "Looking to form a study group before the upcoming exam. We can meet weekly to review material and practice problems together. Anyone interested?",
  
  "After spending months learning this topic, I wanted to share some insights that might help fellow students. Here's my breakdown of the key concepts.",
  
  "Does anyone have experience with this? I'm working on a project and could use some guidance from someone who's been through this before.",
  
  "I discovered this amazing resource that completely changed how I understand this subject. Thought it might help others who are struggling with the same topics.",
  
  "Just finished my research on this topic and wanted to share my findings with the community. Here are the most important points I discovered.",
  
  "Has anyone else noticed this trend? I've been observing this pattern in my studies and wondering if others have similar experiences.",
  
  "I'm organizing a workshop on this topic next week. It's going to cover all the essential concepts with practical examples. Let me know if you're interested!",
  
  "After comparing different approaches to this problem, I found that this method works best. Here's a detailed explanation of why it's more effective.",
  
  "I've compiled a comprehensive list of resources for anyone studying this subject. These materials have been incredibly helpful in my learning journey."
];

const tags = [
  // Academic subjects
  ['mathematics', 'calculus', 'study-help'],
  ['chemistry', 'exam-prep', 'study-group'],
  ['computer-science', 'algorithms', 'programming'],
  ['physics', 'lab-work', 'research'],
  ['javascript', 'web-development', 'coding'],
  ['economics', 'statistics', 'analysis'],
  ['biology', 'cell-biology', 'notes'],
  ['mathematics', 'proofs', 'tutorial'],
  ['history', 'research', 'writing'],
  ['psychology', 'statistics', 'help'],
  
  // Discussion tags
  ['programming', 'languages', 'discussion'],
  ['study-tips', 'memory', 'techniques'],
  ['campus-life', 'experience', 'social'],
  ['internship', 'career', 'technology'],
  ['graduate-school', 'applications', 'advice'],
  ['time-management', 'productivity', 'students'],
  ['online-learning', 'education', 'debate'],
  ['textbooks', 'chemistry', 'resources'],
  ['research', 'undergraduate', 'opportunities'],
  ['career', 'engineering', 'guidance'],
  
  // Question tags
  ['work-life-balance', 'advice', 'help'],
  ['prerequisites', 'math', 'courses'],
  ['remote-learning', 'challenges', 'discussion'],
  ['note-taking', 'study-skills', 'tips'],
  ['research', 'mentorship', 'guidance'],
  ['productivity', 'apps', 'tools'],
  ['stress', 'mental-health', 'support'],
  ['group-projects', 'teamwork', 'management'],
  ['presentation', 'skills', 'improvement'],
  ['study-abroad', 'international', 'programs'],
  
  // Resource tags
  ['physics', 'notes', 'sharing'],
  ['coding', 'bootcamp', 'free-resources'],
  ['writing', 'essays', 'humanities'],
  ['lab-safety', 'protocols', 'guidelines'],
  ['programming', 'projects', 'beginners'],
  ['academic-writing', 'tips', 'guide'],
  ['scholarships', 'funding', 'opportunities'],
  ['career-fair', 'preparation', 'networking'],
  ['interviews', 'job-search', 'preparation'],
  ['calendar', 'deadlines', 'planning']
];

const postTypes = ['text', 'link', 'note'];

async function generatePosts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users and communities
    console.log('👥 Fetching users and communities...');
    const users = await User.find({}, '_id username display_name');
    const communities = await Community.find({}, '_id name displayName');
    
    console.log(`📊 Found ${users.length} users and ${communities.length} communities`);

    if (users.length === 0 || communities.length === 0) {
      console.log('❌ Need users and communities to create posts');
      return;
    }

    console.log('📝 Checking existing posts...');
    const existingPostCount = await Post.countDocuments();
    console.log(`📋 Current posts in database: ${existingPostCount}`);

    console.log('📝 Generating 40 new posts...');
    const posts = [];

    for (let i = 0; i < 40; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomCommunity = communities[Math.floor(Math.random() * communities.length)];
      const randomType = postTypes[Math.floor(Math.random() * postTypes.length)];
      
      const title = postTitles[i % postTitles.length];
      const content = postContents[Math.floor(Math.random() * postContents.length)];
      const postTags = tags[i % tags.length];
      
      const post = {
        title,
        content,
        type: randomType,
        author: randomUser._id,
        community: randomCommunity._id,
        upvotes: Math.floor(Math.random() * 50), // 0-49 upvotes
        downvotes: Math.floor(Math.random() * 10), // 0-9 downvotes
        comment_count: Math.floor(Math.random() * 25), // 0-24 comments
        tags: postTags,
        is_pinned: Math.random() > 0.95, // 5% chance of being pinned
        is_locked: Math.random() > 0.98, // 2% chance of being locked
      };

      // Add type-specific fields only when needed
      if (randomType === 'link') {
        const linkUrls = [
          'https://www.khanacademy.org/math/calculus-1',
          'https://www.coursera.org/learn/algorithms-part1',
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
          'https://stackoverflow.com/questions/tagged/python',
          'https://github.com/topics/machine-learning',
          'https://www.edx.org/course/introduction-computer-science',
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          'https://arxiv.org/list/cs.AI/recent',
          'https://www.reddit.com/r/learnprogramming',
          'https://leetcode.com/problemset/all/'
        ];
        post.link_url = linkUrls[Math.floor(Math.random() * linkUrls.length)];
      }
      
      // Only add note_file for posts that are actually of type 'note'
      if (randomType === 'note') {
        const noteFiles = [
          { name: 'calculus_notes.pdf', type: 'application/pdf', size: 2048576 },
          { name: 'chemistry_formulas.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 1024768 },
          { name: 'physics_lab_report.pdf', type: 'application/pdf', size: 3072384 },
          { name: 'programming_cheatsheet.txt', type: 'text/plain', size: 512000 },
          { name: 'biology_diagrams.png', type: 'image/png', size: 4096512 }
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

    console.log('💾 Inserting posts into database...');
    
    let insertedCount = 0;
    for (const postData of posts) {
      try {
        const post = new Post(postData);
        await post.save();
        insertedCount++;
        
        if (insertedCount % 10 === 0) {
          console.log(`✅ Inserted ${insertedCount} posts...`);
        }
      } catch (error) {
        console.error(`❌ Error inserting post "${postData.title}":`, error.message);
      }
    }

    console.log(`🎉 Successfully inserted ${insertedCount} new posts!`);
    
    const finalPostCount = await Post.countDocuments();
    console.log(`📊 Total posts in database: ${finalPostCount}`);

    // Show some statistics
    console.log('\n📊 Post Statistics:');
    
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

    // Show sample of created posts
    console.log('\n📋 Sample of created posts:');
    const samplePosts = await Post.find({})
      .populate('author', 'username display_name')
      .populate('community', 'name displayName')
      .sort({ createdAt: -1 })
      .limit(5);
    
    samplePosts.forEach((post, index) => {
      console.log(`${index + 1}. "${post.title}"`);
      console.log(`   Type: ${post.type} | Author: ${post.author.display_name} (@${post.author.username})`);
      console.log(`   Community: ${post.community.displayName || post.community.name}`);
      console.log(`   Engagement: ${post.upvotes} upvotes, ${post.downvotes} downvotes, ${post.comment_count} comments`);
      console.log(`   Tags: ${post.tags.join(', ')}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error generating posts:', error);
  } finally {
    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

generatePosts();
