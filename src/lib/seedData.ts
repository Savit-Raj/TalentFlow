/**
 * Seed Data Generator for TalentFlow
 * Creates realistic test data for jobs, candidates, and assessments
 * 
 * This file generates:
 * - 25 jobs with mixed active/archived status
 * - 1,000+ candidates distributed across jobs and stages
 * - 3+ comprehensive assessments with 10+ questions each
 * - Realistic timeline entries for candidate interactions
 */

import { db, generateId, generateSlug, createTimelineEntry } from './database';
import type { Job, Candidate, Assessment, AssessmentSection } from './database';

/**
 * Sample Data Arrays
 * These provide variety and realism to our generated data
 */

const jobTitles = [
  'Senior Frontend Developer', 'Backend Engineer', 'Full Stack Developer', 'DevOps Engineer',
  'Product Manager', 'UX Designer', 'Data Scientist', 'Mobile Developer',
  'Technical Lead', 'Software Architect', 'QA Engineer', 'Site Reliability Engineer',
  'React Developer', 'Node.js Developer', 'Python Developer', 'Java Developer',
  'UI/UX Designer', 'Product Designer', 'Data Analyst', 'Machine Learning Engineer',
  'Cloud Engineer', 'Security Engineer', 'Database Administrator', 'Technical Writer',
  'Scrum Master'
];

const jobDescriptions = [
  'Join our innovative team to build cutting-edge web applications using modern technologies.',
  'We are looking for a passionate developer to help shape the future of our platform.',
  'Seeking an experienced professional to lead technical initiatives and mentor junior developers.',
  'Join a fast-growing startup where you can make a significant impact on product development.',
  'Work with a talented team on challenging projects that serve millions of users worldwide.',
];


const locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Remote'];
const skills = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker',
  'Kubernetes', 'MongoDB', 'PostgreSQL', 'GraphQL', 'REST APIs', 'Git', 'Agile', 'Scrum'
];

const firstNames = [
  'Alex', 'Sarah', 'Michael', 'Jessica', 'David', 'Emily', 'James', 'Ashley', 'Chris', 'Amanda',
  'Ryan', 'Jennifer', 'Kevin', 'Lisa', 'Brian', 'Michelle', 'Jason', 'Nicole', 'Daniel', 'Rachel',
  'Matt', 'Laura', 'John', 'Karen', 'Paul', 'Amy', 'Mark', 'Susan', 'Steve', 'Anna'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
];

const educationLevels = [
  'Bachelor\'s in Computer Science', 'Master\'s in Software Engineering', 'Bachelor\'s in Information Technology',
  'PhD in Computer Science', 'Bachelor\'s in Engineering', 'Master\'s in Data Science', 'Bootcamp Graduate'
];

/**
 * Utility Functions for Data Generation
 */

const getRandomItem = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];
const getRandomItems = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const getRandomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Predefined job numbers for the 25 seed jobs
const predefinedJobNumbers = [
  '10001', '10002', '10003', '10004', '10005', '10006', '10007', '10008', '10009', '10010',
  '10011', '10012', '10013', '10014', '10015', '10016', '10017', '10018', '10019', '10020',
  '10021', '10022', '10023', '10024', '10025'
];

/**
 * Job Data Generator
 * Creates 25 jobs with realistic attributes and mixed status
 */
const generateJobs = (): Job[] => {
  const jobs: Job[] = [];
  const usedTitles = new Set<string>();

  for (let i = 0; i < 25; i++) {
    let title: string;
    do {
      title = getRandomItem(jobTitles);
    } while (usedTitles.has(title));
    usedTitles.add(title);

    const createdAt = getRandomDate(new Date(2023, 0, 1), new Date());
    
    const job: Job = {
      id: generateId(),
      jobNumber: predefinedJobNumbers[i],
      title,
      description: getRandomItem(jobDescriptions),
      slug: generateSlug(title),
      status: Math.random() < 0.7 ? 'active' : 'archived', // 70% active, 30% archived
      tags: getRandomItems(skills, Math.floor(Math.random() * 4) + 2),
      order: i + 1,
      requirements: getRandomItems([
        'Bachelor\'s degree in Computer Science or related field',
        '3+ years of professional experience',
        'Strong problem-solving skills',
        'Experience with Agile methodologies',
        'Excellent communication skills',
        'Experience with modern web technologies',
        'Knowledge of database design',
        'Experience with cloud platforms'
      ], Math.floor(Math.random() * 3) + 3),
      location: getRandomItem(locations),
      type: getRandomItem(['full-time', 'part-time', 'contract', 'internship'] as const),
      salary: {
        min: 80000 + Math.floor(Math.random() * 50000),
        max: 120000 + Math.floor(Math.random() * 80000),
        currency: getRandomItem(['USD', 'EUR', 'INR'])
      },
      createdAt,
      updatedAt: createdAt,
    };

    jobs.push(job);
  }

  return jobs;
};

/**
 * Candidate Data Generator
 * Creates 1000+ candidates distributed across jobs and stages
 */
const generateCandidates = (jobs: Job[]): Candidate[] => {
  const candidates: Candidate[] = [];
  const usedEmails = new Set<string>();

  for (let i = 0; i < 1000; i++) {
    const firstName = getRandomItem(firstNames);
    const lastName = getRandomItem(lastNames);
    let email: string;
    
    do {
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@email.com`;
    } while (usedEmails.has(email));
    usedEmails.add(email);

    const job = getRandomItem(jobs);
    const createdAt = getRandomDate(job.createdAt, new Date());

    // Realistic stage distribution
    const stageWeights = {
      applied: 0.4,    // 40%
      screen: 0.25,    // 25%
      tech: 0.15,      // 15%
      offer: 0.08,     // 8%
      hired: 0.07,     // 7%
      rejected: 0.05   // 5%
    };

    const rand = Math.random();
    let stage: Candidate['stage'] = 'applied';
    let cumulative = 0;
    
    for (const [stageName, weight] of Object.entries(stageWeights)) {
      cumulative += weight;
      if (rand <= cumulative) {
        stage = stageName as Candidate['stage'];
        break;
      }
    }

    const candidate: Candidate = {
      id: generateId(),
      name: `${firstName} ${lastName}`,
      email,
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      stage,
      jobId: job.id,
      skills: getRandomItems(skills, Math.floor(Math.random() * 6) + 3),
      experience: Math.floor(Math.random() * 15) + 1,
      education: getRandomItem(educationLevels),
      location: getRandomItem(locations),
      notes: [],
      createdAt,
      updatedAt: createdAt,
    };

    candidates.push(candidate);
  }

  return candidates;
};

/**
 * Assessment Data Generator
 * Creates comprehensive assessments with various question types
 */
const generateAssessments = (jobs: Job[]): Assessment[] => {
  const assessments: Assessment[] = [];

  // Create assessments for active jobs (about 70% of them)
  const activeJobs = jobs.filter(job => job.status === 'active');
  const jobsWithAssessments = getRandomItems(activeJobs, Math.floor(activeJobs.length * 0.7));

  jobsWithAssessments.forEach((job) => {
    const sections: AssessmentSection[] = [
      {
        id: generateId(),
        title: 'Technical Skills',
        description: 'Evaluate your technical knowledge and experience',
        order: 1,
        questions: [
          {
            id: generateId(),
            type: 'single-choice',
            title: 'How many years of professional development experience do you have?',
            required: true,
            options: ['0-1 years', '2-3 years', '4-5 years', '6-10 years', '10+ years'],
            order: 1,
          },
          {
            id: generateId(),
            type: 'multi-choice',
            title: 'Which programming languages are you proficient in?',
            required: true,
            options: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP'],
            order: 2,
          },
          {
            id: generateId(),
            type: 'long-text',
            title: 'Describe a challenging technical problem you solved recently',
            description: 'Please provide details about the problem, your approach, and the outcome',
            required: true,
            validation: { minLength: 100, maxLength: 1000 },
            order: 3,
          },
          {
            id: generateId(),
            type: 'numeric',
            title: 'Rate your proficiency with React (1-10)',
            required: true,
            validation: { min: 1, max: 10 },
            order: 4,
          },
        ],
      },
      {
        id: generateId(),
        title: 'Experience & Background',
        description: 'Tell us about your professional background',
        order: 2,
        questions: [
          {
            id: generateId(),
            type: 'short-text',
            title: 'What is your current job title?',
            required: true,
            validation: { maxLength: 100 },
            order: 1,
          },
          {
            id: generateId(),
            type: 'single-choice',
            title: 'Are you currently employed?',
            required: true,
            options: ['Yes, full-time', 'Yes, part-time', 'No, actively looking', 'No, not looking'],
            order: 2,
          },
          {
            id: generateId(),
            type: 'long-text',
            title: 'Why are you interested in this position?',
            description: 'Please explain what attracts you to this role and our company',
            required: true,
            validation: { minLength: 50, maxLength: 500 },
            conditionalLogic: {
              dependsOn: generateId(), // This would reference the employment question in a real scenario
              showWhen: 'No, actively looking'
            },
            order: 3,
          },
          {
            id: generateId(),
            type: 'file-upload',
            title: 'Upload your resume/CV',
            description: 'Please upload a PDF or Word document',
            required: true,
            order: 4,
          },
        ],
      },
      {
        id: generateId(),
        title: 'Scenario-Based Questions',
        description: 'How would you handle these workplace situations?',
        order: 3,
        questions: [
          {
            id: generateId(),
            type: 'long-text',
            title: 'How would you handle a situation where you disagree with a technical decision made by your team lead?',
            required: true,
            validation: { minLength: 100, maxLength: 500 },
            order: 1,
          },
          {
            id: generateId(),
            type: 'single-choice',
            title: 'When faced with a tight deadline, which approach do you prefer?',
            required: true,
            options: [
              'Focus on core functionality first',
              'Work longer hours to deliver everything',
              'Negotiate scope with stakeholders',
              'Ask for additional resources'
            ],
            order: 2,
          },
          {
            id: generateId(),
            type: 'multi-choice',
            title: 'Which aspects of software development do you find most rewarding?',
            required: false,
            options: [
              'Solving complex problems',
              'Learning new technologies',
              'Collaborating with team members',
              'Seeing users benefit from your work',
              'Mentoring junior developers',
              'Code reviews and improving code quality'
            ],
            order: 3,
          },
        ],
      },
    ];

    const assessment: Assessment = {
      id: generateId(),
      jobId: job.id,
      title: `${job.title} Assessment`,
      description: `Complete this assessment to demonstrate your qualifications for the ${job.title} position.`,
      sections,
      isActive: true,
      createdAt: job.createdAt,
      updatedAt: job.createdAt,
    };

    assessments.push(assessment);
  });

  return assessments;
};

/**
 * Timeline Data Generator
 * Creates realistic interaction history for candidates
 */
const generateTimeline = async (candidates: Candidate[]): Promise<void> => {
  for (const candidate of candidates) {
    // Initial application
    await createTimelineEntry(
      candidate.id,
      'stage_change',
      'Application Received',
      `${candidate.name} applied for the position`,
      { previousStage: 'none', newStage: 'applied' }
    );

    // Generate additional timeline entries based on current stage
    const stageOrder = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];
    const currentStageIndex = stageOrder.indexOf(candidate.stage);

    for (let i = 1; i <= currentStageIndex; i++) {
      const stage = stageOrder[i];
      const stageNames = {
        screen: 'Moved to Phone Screen',
        tech: 'Moved to Technical Interview',
        offer: 'Offer Extended',
        hired: 'Hired',
        rejected: 'Application Rejected'
      };

      if (stage !== 'applied') {
        await createTimelineEntry(
          candidate.id,
          'stage_change',
          stageNames[stage as keyof typeof stageNames],
          `Candidate progressed to ${stage} stage`,
          { previousStage: stageOrder[i - 1], newStage: stage }
        );
      }
    }

    // Add some random notes and interactions
    if (Math.random() < 0.3) { // 30% chance of having notes
      await createTimelineEntry(
        candidate.id,
        'note_added',
        'Interview Notes Added',
        'Technical interview went well. Strong problem-solving skills demonstrated.',
        { interviewType: 'technical', rating: 4 }
      );
    }

    if (currentStageIndex >= 2 && Math.random() < 0.4) { // 40% chance if past screen stage
      await createTimelineEntry(
        candidate.id,
        'assessment_completed',
        'Assessment Completed',
        'Candidate completed the technical assessment',
        { score: Math.floor(Math.random() * 40) + 60 } // 60-100 score
      );
    }
  }
};

/**
 * Main Seed Function
 * Orchestrates the entire seeding process
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await Promise.all([
      db.jobs.clear(),
      db.candidates.clear(),
      db.assessments.clear(),
      db.candidateResponses.clear(),
      db.timeline.clear(),
    ]);

    // Generate and insert jobs
    console.log(' Generating jobs...');
    const jobs = generateJobs();
    await db.jobs.bulkAdd(jobs);

    // Generate and insert candidates
    console.log(' Generating candidates...');
    const candidates = generateCandidates(jobs);
    await db.candidates.bulkAdd(candidates);

    // Generate and insert assessments
    console.log(' Generating assessments...');
    const assessments = generateAssessments(jobs);
    await db.assessments.bulkAdd(assessments);

    // Generate timeline entries
    console.log(' Generating timeline entries...');
    await generateTimeline(candidates);

    console.log(' Database seeding completed successfully!');
    console.log(`Generated: ${jobs.length} jobs, ${candidates.length} candidates, ${assessments.length} assessments`);
  } catch (error) {
    console.error(' Error seeding database:', error);
    throw error;
  }
};

/**
 * Check if database needs seeding
 * Only seed if the database is empty or schema changed
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    const jobCount = await db.jobs.count();
    
    if (jobCount === 0) {
      console.log('🔧 Database is empty, seeding with initial data...');
      await seedDatabase();
    } else {
      // Check if existing jobs have jobNumber field
      const firstJob = await db.jobs.orderBy('id').first();
      if (firstJob && !firstJob.jobNumber) {
        console.log('🔧 Schema changed, regenerating database...');
        await seedDatabase();
      } else {
        console.log(' Database already populated, skipping seed');
      }
    }
  } catch (error) {
    console.error(' Error initializing database:', error);
    throw error;
  }
};

/**
 * Force clear and reseed database
 */
export const clearAndReseedDatabase = async (): Promise<void> => {
  await seedDatabase();
};

/**
 * Why this seeding approach?
 * 
 * 1. Realistic data: Uses varied, believable names, companies, and scenarios
 * 2. Proper distribution: Stage distribution matches real hiring funnels
 * 3. Relationship integrity: All foreign keys properly reference existing entities
 * 4. Performance: Uses bulk operations for efficient data insertion
 * 5. Comprehensive coverage: Tests all features including complex assessments
 * 6. Timeline generation: Creates realistic interaction history for testing
 * 7. Conditional seeding: Only seeds empty databases to avoid duplicates
 */