/**
 * Database Schema and Setup for TalentFlow
 * Uses Dexie (IndexedDB wrapper) for client-side persistence
 * 
 * This file defines the database structure for our hiring platform:
 * - Jobs table for job postings
 * - Candidates table for applicant data
 * - Assessments table for job-specific forms
 * - CandidateResponses for assessment submissions
 * - Timeline for candidate status tracking
 */

import Dexie, { type Table } from 'dexie';

// Type definitions for our data models
export interface Job {
  id: string;
  jobNumber: string; // 5-digit job ID for public display
  title: string;
  description: string;
  slug: string;
  status: 'active' | 'archived';
  tags: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
  requirements?: string[];
  location?: string;
  type?: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  stage: 'applied' | 'screen' | 'tech' | 'offer' | 'hired' | 'rejected';
  jobId: string;
  platform: 'Indeed' | 'LinkedIn' | 'Glassdoor' | 'AngelList' | 'Company Website';
  resumeUrl?: string;
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
  skills?: string[];
  experience?: number; // years
  education?: string;
  location?: string;
}

export interface Assessment {
  id: string;
  jobId: string;
  title: string;
  description?: string;
  sections: AssessmentSection[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface AssessmentSection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  order: number;
}

export interface Question {
  id: string;
  type: 'single-choice' | 'multi-choice' | 'short-text' | 'long-text' | 'numeric' | 'file-upload';
  title: string;
  description?: string;
  required: boolean;
  options?: string[]; // for choice questions
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number; // for numeric
    max?: number; // for numeric
  };
  conditionalLogic?: {
    dependsOn: string; // another question ID
    showWhen: string; // value that triggers showing this question
  };
  order: number;
}

export interface CandidateResponse {
  id: string;
  candidateId: string;
  assessmentId: string;
  jobId: string;
  responses: Record<string, string | number | boolean | string[]>; // questionId -> answer
  submittedAt: Date;
  status: 'draft' | 'submitted' | 'reviewed';
}

export interface TimelineEntry {
  id: string;
  candidateId: string;
  type: 'stage_change' | 'note_added' | 'assessment_completed' | 'interview_scheduled';
  title: string;
  description: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt: Date;
  createdBy?: string; // user who made the change
}

/**
 * TalentFlow Database Class
 * Extends Dexie to provide typed access to our tables
 */
class TalentFlowDatabase extends Dexie {
  // Table declarations with proper typing
  jobs!: Table<Job>;
  candidates!: Table<Candidate>;
  assessments!: Table<Assessment>;
  candidateResponses!: Table<CandidateResponse>;
  timeline!: Table<TimelineEntry>;

  constructor() {
    super('TalentFlowDB');
    
    // Define schemas and indexes for efficient querying
    this.version(3).stores({
      jobs: '++id, jobNumber, title, status, slug, order, createdAt',
      candidates: '++id, name, email, stage, jobId, createdAt',
      assessments: '++id, jobId, title, isActive, createdAt',
      candidateResponses: '++id, candidateId, assessmentId, jobId, status, submittedAt',
      timeline: '++id, candidateId, type, createdAt'
    });

    // Hook to automatically set timestamps
    this.jobs.hook('creating', (_, obj) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.jobs.hook('updating', (modifications: Partial<Job>) => {
      modifications.updatedAt = new Date();
    });

    this.candidates.hook('creating', (_, obj) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.candidates.hook('updating', (modifications: Partial<Candidate>) => {
      modifications.updatedAt = new Date();
    });

    this.assessments.hook('creating', (_, obj) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.assessments.hook('updating', (modifications: Partial<Assessment>) => {
      modifications.updatedAt = new Date();
    });
  }
}

// Create and export database instance
export const db = new TalentFlowDatabase();

/**
 * Database Utilities
 * Helper functions for common database operations
 */

// Generate unique IDs for our records
export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Generate 5-digit job numbers
export const generateJobNumber = (): string => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

// Generate URL-friendly slugs from job titles
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Validate job data before saving
export const validateJob = (job: Partial<Job>): string[] => {
  const errors: string[] = [];
  
  if (!job.title || job.title.trim().length === 0) {
    errors.push('Job title is required');
  }
  
  if (job.title && job.title.length > 100) {
    errors.push('Job title must be less than 100 characters');
  }
  
  if (!job.status || !['active', 'archived'].includes(job.status)) {
    errors.push('Job status must be either active or archived');
  }
  
  return errors;
};

// Validate candidate data
export const validateCandidate = (candidate: Partial<Candidate>): string[] => {
  const errors: string[] = [];
  
  if (!candidate.name || candidate.name.trim().length === 0) {
    errors.push('Candidate name is required');
  }
  
  if (!candidate.email || candidate.email.trim().length === 0) {
    errors.push('Candidate email is required');
  }
  
  if (candidate.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email)) {
    errors.push('Invalid email format');
  }
  
  if (!candidate.stage || !['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'].includes(candidate.stage)) {
    errors.push('Invalid candidate stage');
  }
  
  return errors;
};

// Create timeline entry when candidate stage changes
export const createTimelineEntry = async (
  candidateId: string,
  type: TimelineEntry['type'],
  title: string,
  description: string,
  metadata?: Record<string, string | number | boolean>
): Promise<string> => {
  const entry: TimelineEntry = {
    id: generateId(),
    candidateId,
    type,
    title,
    description,
    metadata,
    createdAt: new Date(),
  };
  
  return await db.timeline.add(entry);
};

/**
 * Why this architecture?
 * 
 * 1. Dexie over raw IndexedDB: Provides a clean, Promise-based API with TypeScript support
 * 2. Comprehensive typing: Every entity is fully typed for better developer experience
 * 3. Automatic timestamps: Hooks ensure data integrity without manual intervention
 * 4. Validation functions: Client-side validation prevents invalid data entry
 * 5. Helper utilities: Common operations like ID generation and slug creation are centralized
 * 6. Timeline tracking: Built-in audit trail for candidate interactions
 * 7. Flexible schema: Can handle complex assessment structures and conditional logic
 */