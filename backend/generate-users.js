const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

// Sample data for generating realistic users
const universities = [
  'Harvard University', 'Stanford University', 'MIT', 'UC Berkeley', 'Yale University',
  'Princeton University', 'Columbia University', 'University of Pennsylvania', 'Duke University',
  'Northwestern University', 'University of Chicago', 'Cornell University', 'Johns Hopkins University',
  'University of Michigan', 'UCLA', 'USC', 'NYU', 'Boston University', 'Georgetown University',
  'Carnegie Mellon University', 'University of Texas at Austin', 'Georgia Tech', 'University of Florida',
  'Ohio State University', 'Penn State University', 'University of Washington', 'University of Wisconsin'
];

const domains = [
  'Computer Science', 'Engineering', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Psychology', 'Business Administration', 'Economics', 'Political Science', 'History',
  'English Literature', 'Art History', 'Philosophy', 'Sociology', 'Anthropology',
  'Environmental Science', 'Medicine', 'Law', 'Education', 'Music', 'Theater',
  'Data Science', 'Information Systems', 'Mechanical Engineering', 'Electrical Engineering'
];

const interests = [
  'Programming', 'Machine Learning', 'Web Development', 'Data Analysis', 'Research',
  'Reading', 'Writing', 'Photography', 'Music', 'Sports', 'Travel', 'Gaming',
  'Art', 'Science', 'Technology', 'Mathematics', 'Physics', 'Chemistry',
  'Biology', 'History', 'Literature', 'Philosophy', 'Psychology', 'Economics',
  'Politics', 'Environment', 'Health', 'Fitness', 'Cooking', 'Movies'
];

const firstNames = [
  'Alexander', 'Emma', 'Michael', 'Olivia', 'William', 'Sophia', 'James', 'Isabella',
  'Benjamin', 'Charlotte', 'Lucas', 'Amelia', 'Henry', 'Mia', 'Sebastian', 'Harper',
  'Jackson', 'Evelyn', 'David', 'Abigail', 'Matthew', 'Emily', 'Samuel', 'Elizabeth',
  'Daniel', 'Sofia', 'Joseph', 'Avery', 'Gabriel', 'Ella', 'Anthony', 'Scarlett',
  'Christopher', 'Grace', 'Andrew', 'Chloe', 'Joshua', 'Victoria', 'Ryan', 'Riley'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

const bios = [
  'Passionate about technology and innovation. Love solving complex problems.',
  'Computer science student with a keen interest in artificial intelligence.',
  'Aspiring software engineer who enjoys building web applications.',
  'Data science enthusiast exploring machine learning algorithms.',
  'Pre-med student balancing studies with research opportunities.',
  'Business major with entrepreneurial aspirations and leadership experience.',
  'Engineering student passionate about sustainable technology solutions.',
  'Psychology major interested in human behavior and cognitive science.',
  'Mathematics student who loves abstract thinking and problem-solving.',
  'Art student combining creativity with digital media technologies.',
  'Physics major fascinated by quantum mechanics and space exploration.',
  'Biology student conducting research in molecular genetics.',
  'Economics student analyzing market trends and financial systems.',
  'History major with a focus on ancient civilizations and cultures.',
  'Literature student exploring contemporary and classic works.',
  'Philosophy major pondering existential questions and ethics.',
  'Chemistry student working on organic synthesis projects.',
  'Environmental science student advocating for climate action.',
  'Music major composing and performing classical and modern pieces.',
  'Theater student passionate about storytelling and performance.'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateUsername(firstName, lastName) {
  const variations = [
    `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}`,
    `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName.charAt(0).toLowerCase()}${Math.floor(Math.random() * 1000)}`
  ];
  return getRandomElement(variations);
}

function generateEmail(username, university) {
  const domain = university.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10) + '.edu';
  return `${username}@${domain}`;
}

async function generateUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('📊 Checking existing users...');
    const existingUserCount = await User.countDocuments();
    console.log(`📋 Current users in database: ${existingUserCount}`);

    console.log('👥 Generating 35 new users...');
    const users = [];

    for (let i = 0; i < 35; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const username = generateUsername(firstName, lastName);
      const university = getRandomElement(universities);
      const email = generateEmail(username, university);
      
      // Generate a simple password (in real app, users would set their own)
      const password = 'password123'; // This will be hashed by the pre-save hook
      
      const user = {
        username,
        email,
        password_hash: password, // Will be hashed by the schema pre-save hook
        display_name: `${firstName} ${lastName}`,
        university,
        verified: Math.random() > 0.3, // 70% chance of being verified
        karma: Math.floor(Math.random() * 1000), // Random karma between 0-999
        bio: getRandomElement(bios),
        interests: getRandomElements(interests, Math.floor(Math.random() * 5) + 2), // 2-6 interests
        domain: getRandomElement(domains)
      };

      users.push(user);
    }

    console.log('💾 Inserting users into database...');
    
    // Insert users one by one to trigger the password hashing middleware
    let insertedCount = 0;
    for (const userData of users) {
      try {
        const user = new User(userData);
        await user.save();
        insertedCount++;
        
        if (insertedCount % 5 === 0) {
          console.log(`✅ Inserted ${insertedCount} users...`);
        }
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️  Skipping duplicate user: ${userData.username}`);
        } else {
          console.error(`❌ Error inserting user ${userData.username}:`, error.message);
        }
      }
    }

    console.log(`🎉 Successfully inserted ${insertedCount} new users!`);
    
    const finalUserCount = await User.countDocuments();
    console.log(`📊 Total users in database: ${finalUserCount}`);

    console.log('\n📋 Sample of created users:');
    const sampleUsers = await User.find({}, 'username display_name university domain verified karma')
      .sort({ createdAt: -1 })
      .limit(5);
    
    sampleUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.display_name} (@${user.username})`);
      console.log(`   University: ${user.university}`);
      console.log(`   Domain: ${user.domain}`);
      console.log(`   Verified: ${user.verified ? '✓' : '✗'} | Karma: ${user.karma}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error generating users:', error);
  } finally {
    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

generateUsers();
