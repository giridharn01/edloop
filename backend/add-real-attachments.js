const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Note = require('./models/Note');
require('dotenv').config();

// Create sample files for demonstration
function createSampleFiles() {
  const samplesDir = path.join(__dirname, 'sample-files');
  
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
  }

  // Create sample PDF content (basic text file for demo)
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Sample Lecture Notes) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000221 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
314
%%EOF`;

  // Create sample text files
  const lectureNotes = `Computer Science 101 - Lecture Notes
Week 5: Data Structures and Algorithms

Topics Covered:
1. Arrays and Linked Lists
2. Stack and Queue operations
3. Time complexity analysis
4. Basic sorting algorithms

Key Points:
- Arrays provide O(1) access time
- Linked lists allow dynamic memory allocation
- Stack follows LIFO principle
- Queue follows FIFO principle

Homework:
Implement a simple stack using arrays and demonstrate push/pop operations.

Next Week: We'll cover tree data structures and binary search algorithms.`;

  const mathFormulas = `Mathematics 201 - Formula Sheet
Calculus and Linear Algebra

Derivatives:
- d/dx[x^n] = nx^(n-1)
- d/dx[sin(x)] = cos(x)
- d/dx[cos(x)] = -sin(x)
- d/dx[e^x] = e^x
- d/dx[ln(x)] = 1/x

Integrals:
- ∫x^n dx = x^(n+1)/(n+1) + C
- ∫sin(x) dx = -cos(x) + C
- ∫cos(x) dx = sin(x) + C
- ∫e^x dx = e^x + C

Matrix Operations:
- Addition: [A + B]ij = Aij + Bij
- Multiplication: [AB]ij = Σk Aik * Bkj
- Determinant: det(2x2) = ad - bc

Eigenvalues and Eigenvectors:
Av = λv where λ is eigenvalue and v is eigenvector`;

  const labReport = `Physics 301 - Lab Report
Experiment: Measuring Acceleration Due to Gravity

Objective:
To determine the acceleration due to gravity using a pendulum.

Equipment:
- Simple pendulum
- Stopwatch
- Measuring tape
- Protractor

Procedure:
1. Set up pendulum with 1-meter string
2. Measure 10 oscillations for small angles
3. Record time and calculate period
4. Repeat for different lengths
5. Plot T² vs L graph

Results:
Length (m) | Period (s) | T² (s²)
0.5        | 1.42       | 2.01
0.7        | 1.68       | 2.82
1.0        | 2.01       | 4.04
1.2        | 2.20       | 4.84

Analysis:
From the slope of T² vs L graph:
g = 4π²/slope = 9.78 m/s²

Error: ±0.1 m/s² (1% accuracy)

Conclusion:
Measured value agrees with accepted value of g = 9.8 m/s²`;

  const studyGuide = `Biology 201 - Midterm Study Guide
Cell Biology and Genetics

Chapter 1: Cell Structure
- Prokaryotes vs Eukaryotes
- Organelles and their functions
- Cell membrane structure
- Transport mechanisms

Chapter 2: DNA and RNA
- DNA structure (double helix)
- Base pairing rules (A-T, G-C)
- Transcription process
- Translation and protein synthesis

Chapter 3: Cell Division
- Mitosis phases (PMAT)
- Meiosis and genetic variation
- Cell cycle regulation
- Cancer and cell cycle

Chapter 4: Genetics
- Mendel's laws
- Punnett squares
- Dominance patterns
- Linkage and crossing over

Key Terms:
- Chromosome, gene, allele
- Genotype vs phenotype
- Homozygous vs heterozygous
- Codominance and incomplete dominance

Practice Problems:
1. Cross AaBb × AaBb, find phenotype ratio
2. Calculate map distance from recombination frequency
3. Identify inheritance pattern from pedigree`;

  const researchPaper = `Psychology 301 - Research Paper
The Impact of Social Media on Adolescent Mental Health

Abstract:
This study examines the relationship between social media usage and mental health outcomes in adolescents aged 13-18. A survey of 500 participants revealed significant correlations between excessive social media use and increased anxiety and depression symptoms.

Introduction:
Social media platforms have become integral to adolescent social interaction. However, concerns about their impact on mental health have emerged. This research investigates these effects through quantitative analysis.

Methodology:
- Participants: 500 adolescents (ages 13-18)
- Tools: PHQ-9 depression scale, GAD-7 anxiety scale
- Social media usage tracked via self-report
- Statistical analysis using SPSS

Results:
- 67% of participants use social media >3 hours/day
- Strong correlation (r=0.72) between usage and anxiety
- Depression scores 23% higher in heavy users
- Sleep quality inversely related to screen time

Discussion:
Results suggest that excessive social media use may contribute to mental health issues in adolescents. Potential mechanisms include social comparison, cyberbullying, and sleep disruption.

Limitations:
- Self-reported data may be biased
- Correlation does not imply causation
- Cross-sectional design limits temporal conclusions

Conclusion:
While social media offers benefits, moderated use is recommended for adolescent mental health. Further longitudinal studies are needed to establish causal relationships.`;

  // Write files
  fs.writeFileSync(path.join(samplesDir, 'lecture_notes.pdf'), pdfContent);
  fs.writeFileSync(path.join(samplesDir, 'cs101_lecture_notes.txt'), lectureNotes);
  fs.writeFileSync(path.join(samplesDir, 'math_formulas.txt'), mathFormulas);
  fs.writeFileSync(path.join(samplesDir, 'physics_lab_report.txt'), labReport);
  fs.writeFileSync(path.join(samplesDir, 'biology_study_guide.txt'), studyGuide);
  fs.writeFileSync(path.join(samplesDir, 'psychology_research.txt'), researchPaper);

  console.log('Sample files created in:', samplesDir);
  return samplesDir;
}

async function addRealAttachmentsToNotes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create sample files
    const samplesDir = createSampleFiles();
    
    // Get some notes to add attachments to
    const notes = await Note.find({}).limit(10);
    
    if (notes.length === 0) {
      console.log('No notes found. Please run generate-notes.js first.');
      return;
    }

    // Sample attachments with real file references
    const sampleAttachments = [
      { 
        name: 'lecture_notes.pdf', 
        url: '/sample-files/lecture_notes.pdf',
        type: 'pdf', 
        size: fs.statSync(path.join(samplesDir, 'lecture_notes.pdf')).size 
      },
      { 
        name: 'cs101_lecture_notes.txt', 
        url: '/sample-files/cs101_lecture_notes.txt',
        type: 'txt', 
        size: fs.statSync(path.join(samplesDir, 'cs101_lecture_notes.txt')).size 
      },
      { 
        name: 'math_formulas.txt', 
        url: '/sample-files/math_formulas.txt',
        type: 'txt', 
        size: fs.statSync(path.join(samplesDir, 'math_formulas.txt')).size 
      },
      { 
        name: 'physics_lab_report.txt', 
        url: '/sample-files/physics_lab_report.txt',
        type: 'txt', 
        size: fs.statSync(path.join(samplesDir, 'physics_lab_report.txt')).size 
      },
      { 
        name: 'biology_study_guide.txt', 
        url: '/sample-files/biology_study_guide.txt',
        type: 'txt', 
        size: fs.statSync(path.join(samplesDir, 'biology_study_guide.txt')).size 
      },
      { 
        name: 'psychology_research.txt', 
        url: '/sample-files/psychology_research.txt',
        type: 'txt', 
        size: fs.statSync(path.join(samplesDir, 'psychology_research.txt')).size 
      }
    ];

    // Add attachments to random notes
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const numAttachments = Math.floor(Math.random() * 3) + 1; // 1-3 attachments
      const selectedAttachments = [];
      
      for (let j = 0; j < numAttachments; j++) {
        const randomAttachment = sampleAttachments[Math.floor(Math.random() * sampleAttachments.length)];
        if (!selectedAttachments.find(a => a.name === randomAttachment.name)) {
          selectedAttachments.push({
            ...randomAttachment,
            uploaded_at: new Date()
          });
        }
      }
      
      note.attachments = selectedAttachments;
      await note.save();
      
      console.log(`Added ${selectedAttachments.length} attachments to note: ${note.title}`);
    }

    console.log(`\nSuccessfully added real file attachments to ${notes.length} notes!`);
    console.log('Files are stored in:', samplesDir);
    console.log('\nTo serve these files, add this to your server.js:');
    console.log('app.use("/sample-files", express.static(path.join(__dirname, "sample-files")));');

  } catch (error) {
    console.error('Error adding attachments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
addRealAttachmentsToNotes();
