const mongoose = require('mongoose');
const Note = require('./models/Note');
const User = require('./models/User');
const Community = require('./models/Community');
require('dotenv').config();

// Sample data for realistic college notes
const subjects = [
  'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English Literature', 'History', 'Psychology', 'Economics', 'Philosophy',
  'Business Administration', 'Engineering', 'Statistics', 'Political Science',
  'Sociology', 'Art History', 'Music Theory', 'Environmental Science'
];

const categories = ['lecture', 'study-guide', 'summary', 'homework', 'exam-prep', 'research', 'other'];
const difficultyLevels = ['beginner', 'intermediate', 'advanced'];

const noteTemplates = [
  {
    titleTemplate: "Introduction to {subject}",
    contentTemplate: "This note covers the fundamental concepts of {subject}. Key topics include:\n\n1. Basic definitions and terminology\n2. Core principles and theories\n3. Real-world applications\n4. Common misconceptions\n\nThe material builds upon previous knowledge and sets the foundation for advanced topics in this field. Students should focus on understanding the underlying concepts rather than memorizing facts.",
    tags: ["fundamentals", "introduction", "basics"]
  },
  {
    titleTemplate: "{subject} Exam Review",
    contentTemplate: "Comprehensive review for the upcoming {subject} exam. Important points to remember:\n\n• Key formulas and equations\n• Common problem-solving strategies\n• Frequently tested concepts\n• Sample questions and solutions\n\nMake sure to practice the examples provided and understand the reasoning behind each solution. Time management during the exam is crucial.",
    tags: ["exam", "review", "preparation"]
  },
  {
    titleTemplate: "Lecture Notes: Week {week} - {subject}",
    contentTemplate: "Today's lecture covered several important topics in {subject}:\n\n1. Main concept discussed\n2. Supporting examples and case studies\n3. Practical applications\n4. Homework assignments\n\nProfessor emphasized the importance of understanding these concepts for the midterm. Additional reading materials are available in the course syllabus.",
    tags: ["lecture", "weekly", "notes"]
  },
  {
    titleTemplate: "{subject} Lab Report",
    contentTemplate: "Laboratory experiment conducted on {date}. Objective: To understand practical applications of theoretical concepts.\n\nProcedure:\n1. Equipment setup and calibration\n2. Data collection methods\n3. Observations and measurements\n4. Analysis and interpretation\n\nResults show clear correlation between variables. Further research needed to validate hypothesis.",
    tags: ["lab", "experiment", "report"]
  },
  {
    titleTemplate: "Study Guide: {subject} Midterm",
    contentTemplate: "Comprehensive study guide for {subject} midterm examination.\n\nChapter 1-5 Summary:\n- Key concepts and definitions\n- Important theorems and proofs\n- Practice problems with solutions\n- Common exam patterns\n\nRecommended study time: 15-20 hours over 2 weeks. Form study groups for better understanding.",
    tags: ["study-guide", "midterm", "preparation"]
  },
  {
    titleTemplate: "Research Paper: {subject} Analysis",
    contentTemplate: "Research paper analyzing current trends in {subject}. Abstract: This paper examines the evolving landscape of modern {subject} practices and their implications.\n\nIntroduction:\nThe field of {subject} has undergone significant changes in recent years. This analysis explores key developments and future prospects.\n\nMethodology:\nLiterature review of peer-reviewed articles from 2020-2024. Data analysis using statistical methods.\n\nConclusion:\nFindings suggest continued growth and innovation in this field.",
    tags: ["research", "analysis", "paper"]
  },
  {
    titleTemplate: "Assignment Solutions: {subject} Problem Set",
    contentTemplate: "Solutions to this week's {subject} problem set. Each solution includes step-by-step explanations.\n\nProblem 1: Basic calculation\nSolution: Start by identifying given variables...\n\nProblem 2: Complex analysis\nSolution: Apply the fundamental theorem...\n\nProblem 3: Real-world application\nSolution: Consider the practical constraints...\n\nTips for similar problems: Always check your work and verify units.",
    tags: ["homework", "solutions", "problems"]
  },
  {
    titleTemplate: "Group Project Notes: {subject}",
    contentTemplate: "Collaborative notes for our {subject} group project.\n\nProject Overview:\n- Team members and responsibilities\n- Timeline and milestones\n- Resource allocation\n- Progress tracking\n\nMeeting Notes:\nWeek 1: Project planning and research\nWeek 2: Data collection and analysis\nWeek 3: Report writing and presentation prep\n\nNext steps: Finalize presentation slides and practice delivery.",
    tags: ["group-project", "collaboration", "teamwork"]
  }
];

const universities = [
  'MIT', 'Stanford University', 'Harvard University', 'UC Berkeley',
  'Carnegie Mellon', 'Caltech', 'University of Michigan', 'Georgia Tech',
  'University of Washington', 'Cornell University'
];

const sampleAttachments = [
  { name: 'lecture_slides.pdf', type: 'pdf', size: 2456789 },
  { name: 'data_analysis.xlsx', type: 'xlsx', size: 876543 },
  { name: 'diagram.png', type: 'png', size: 345678 },
  { name: 'code_example.py', type: 'py', size: 12345 },
  { name: 'references.docx', type: 'docx', size: 654321 },
  { name: 'formula_sheet.pdf', type: 'pdf', size: 234567 },
  { name: 'experiment_video.mp4', type: 'mp4', size: 15678900 }
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomTags() {
  const allTags = [
    'important', 'exam', 'homework', 'review', 'summary', 'notes',
    'lecture', 'lab', 'project', 'research', 'study', 'guide',
    'quiz', 'midterm', 'final', 'assignment', 'tutorial', 'example'
  ];
  const numTags = getRandomNumber(2, 5);
  const shuffled = allTags.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numTags);
}

function generateNoteContent(template, subject, week = null) {
  let content = template.contentTemplate
    .replace(/{subject}/g, subject)
    .replace(/{week}/g, week || getRandomNumber(1, 15))
    .replace(/{date}/g, new Date(2024, getRandomNumber(0, 11), getRandomNumber(1, 28)).toLocaleDateString());
  
  let title = template.titleTemplate
    .replace(/{subject}/g, subject)
    .replace(/{week}/g, week || getRandomNumber(1, 15));
  
  return { title, content, tags: [...template.tags, ...generateRandomTags()] };
}

async function generateNotes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get existing users and communities
    const users = await User.find({}).select('_id');
    const communities = await Community.find({}).select('_id');

    if (users.length === 0 || communities.length === 0) {
      console.log('Please ensure you have users and communities in the database first');
      return;
    }

    console.log(`Found ${users.length} users and ${communities.length} communities`);

    // Clear existing notes (optional - comment out if you want to keep existing notes)
    // await Note.deleteMany({});
    // console.log('Cleared existing notes');

    const notes = [];
    const targetNotes = 55; // Generate 55 notes

    for (let i = 0; i < targetNotes; i++) {
      const template = getRandomElement(noteTemplates);
      const subject = getRandomElement(subjects);
      const category = getRandomElement(categories);
      const difficulty = getRandomElement(difficultyLevels);
      const author = getRandomElement(users)._id;
      const community = getRandomElement(communities)._id;

      const { title, content, tags } = generateNoteContent(template, subject);

      // Generate random attachments (0-3 per note)
      const numAttachments = getRandomNumber(0, 3);
      const attachments = [];
      for (let j = 0; j < numAttachments; j++) {
        const attachment = getRandomElement(sampleAttachments);
        attachments.push({
          name: attachment.name,
          url: `/uploads/notes/${Date.now()}_${attachment.name}`,
          type: attachment.type,
          size: attachment.size + getRandomNumber(-10000, 10000), // Add some variation
          uploaded_at: new Date()
        });
      }

      // Generate random collaborators (0-2 per note)
      const numCollaborators = getRandomNumber(0, 2);
      const collaborators = [{ user: author, permission: 'admin' }]; // Author is always admin
      for (let j = 0; j < numCollaborators; j++) {
        const randomUser = getRandomElement(users)._id;
        if (!collaborators.find(c => c.user.toString() === randomUser.toString())) {
          collaborators.push({
            user: randomUser,
            permission: getRandomElement(['read', 'edit'])
          });
        }
      }

      const note = {
        title,
        content,
        author,
        community,
        subject,
        tags: [...new Set(tags)], // Remove duplicates
        category,
        difficulty_level: difficulty,
        attachments,
        collaborators,
        is_public: Math.random() > 0.1, // 90% public, 10% private
        is_template: Math.random() > 0.8, // 20% templates
        views_count: getRandomNumber(5, 500),
        likes_count: getRandomNumber(0, 50),
        shares_count: getRandomNumber(0, 20),
        version: 1,
        edited_at: Math.random() > 0.5 ? new Date() : null,
        last_accessed: new Date(Date.now() - getRandomNumber(0, 30) * 24 * 60 * 60 * 1000), // Random date within last 30 days
        createdAt: new Date(Date.now() - getRandomNumber(0, 365) * 24 * 60 * 60 * 1000), // Random date within last year
        updatedAt: new Date()
      };

      notes.push(note);
    }

    // Insert all notes
    const result = await Note.insertMany(notes);
    console.log(`Successfully generated and inserted ${result.length} notes`);

    // Display some statistics
    const categoryStats = {};
    const subjectStats = {};
    const difficultyStats = {};

    notes.forEach(note => {
      categoryStats[note.category] = (categoryStats[note.category] || 0) + 1;
      subjectStats[note.subject] = (subjectStats[note.subject] || 0) + 1;
      difficultyStats[note.difficulty_level] = (difficultyStats[note.difficulty_level] || 0) + 1;
    });

    console.log('\n--- Statistics ---');
    console.log('Categories:', categoryStats);
    console.log('Subjects:', subjectStats);
    console.log('Difficulty Levels:', difficultyStats);
    console.log('\nSample note titles:');
    notes.slice(0, 10).forEach((note, index) => {
      console.log(`${index + 1}. ${note.title}`);
    });

  } catch (error) {
    console.error('Error generating notes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
generateNotes();
