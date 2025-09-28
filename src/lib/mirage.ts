/**
 * MirageJS Server Configuration
 * Simulates backend API for frontend-backend communication
 */

import { createServer, Response } from 'miragejs';
import { db } from './database';
import type { Job, Candidate, Assessment } from './database';

interface TimelineItem {
  candidateId: string;
  createdAt: Date;
}

// Cache for data to avoid repeated IndexedDB calls
let dataCache: {
  jobs: Job[];
  candidates: Candidate[];
  assessments: Assessment[];
  timeline: TimelineItem[];
} | null = null;

// Simulate network latency and errors for write operations
const simulateWriteOperation = async () => {
  // Random latency between 200-1200ms
  const latency = Math.random() * 1000 + 200;
  await new Promise(resolve => setTimeout(resolve, latency));
  
  // 5-10% error rate
  const errorRate = Math.random() * 0.05 + 0.05; // 5-10%
  if (Math.random() < errorRate) {
    throw new Error('Simulated server error');
  }
};

// Load data from IndexedDB
async function loadData() {
  if (dataCache) {
    console.log('Using cached data');
    return dataCache;
  }
  
  console.log('Loading data from IndexedDB...');
  try {
    const [jobs, candidates, assessments, timeline] = await Promise.all([
      db.jobs.toArray(),
      db.candidates.toArray(),
      db.assessments.toArray(),
      db.timeline.toArray(),
    ]);
    
    console.log('Loaded data:', { jobs: jobs.length, candidates: candidates.length, assessments: assessments.length, timeline: timeline.length });
    dataCache = { jobs, candidates, assessments, timeline };
    return dataCache;
  } catch (error) {
    console.error('Failed to load data from IndexedDB:', error);
    return { jobs: [], candidates: [], assessments: [], timeline: [] };
  }
}

export function makeServer({ environment = 'development' } = {}) {
  return createServer({
    environment,

    routes() {
      this.namespace = 'api';

      // Jobs endpoints
      this.get('/jobs', (_schema, request) => {
        console.log('Jobs endpoint called with params:', request.queryParams);
        
        const queryParams = request.queryParams || {};
        const search = Array.isArray(queryParams.search) ? queryParams.search[0] : (queryParams.search || '');
        const status = Array.isArray(queryParams.status) ? queryParams.status[0] : (queryParams.status || '');
        const page = Array.isArray(queryParams.page) ? queryParams.page[0] : (queryParams.page || '1');
        const pageSize = Array.isArray(queryParams.pageSize) ? queryParams.pageSize[0] : (queryParams.pageSize || '12');
        const sort = Array.isArray(queryParams.sort) ? queryParams.sort[0] : (queryParams.sort || 'order');
        const order = Array.isArray(queryParams.order) ? queryParams.order[0] : (queryParams.order || 'asc');
        
        return loadData().then(data => {
          console.log('Jobs data loaded, processing...');
          let jobs = [...data.jobs];
          
          // Sort
          if (sort === 'order') {
            jobs.sort((a, b) => order === 'asc' ? a.order - b.order : b.order - a.order);
          } else {
            jobs.sort((a, b) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return order === 'asc' ? dateA - dateB : dateB - dateA;
            });
          }
          
          // Filter
          if (search) {
            jobs = jobs.filter(job => 
              job.title.toLowerCase().includes(search.toLowerCase()) ||
              job.tags.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()))
            );
          }
          
          if (status) {
            jobs = jobs.filter(job => job.status === status);
          }
          
          // Paginate
          const total = jobs.length;
          const pageNum = parseInt(page);
          const pageSizeNum = parseInt(pageSize);
          const totalPages = Math.ceil(total / pageSizeNum);
          const startIndex = (pageNum - 1) * pageSizeNum;
          const paginatedJobs = jobs.slice(startIndex, startIndex + pageSizeNum);
          
          const result = {
            data: paginatedJobs,
            pagination: {
              page: pageNum,
              pageSize: pageSizeNum,
              total,
              totalPages,
              hasNext: startIndex + pageSizeNum < total,
              hasPrev: pageNum > 1,
            }
          };
          
          console.log('Jobs endpoint returning:', result);
          return result;
        }).catch(error => {
          console.error('Jobs endpoint error:', error);
          return new Response(500, {}, { error: 'Database error' });
        });
      });

      this.get('/jobs/:jobNumber', async (_schema, request) => {
        try {
          const data = await loadData();
          const job = data.jobs.find(j => j.jobNumber === request.params.jobNumber);
          return job || null;
        } catch {
          return new Response(500, {}, { error: 'Database error' });
        }
      });

      this.post('/jobs', async () => {
        try {
          await simulateWriteOperation();
          return new Response(501, {}, { error: 'Not implemented' });
        } catch (error) {
          return new Response(500, {}, { error: error instanceof Error ? error.message : 'Server error' });
        }
      });

      this.put('/jobs/:id', async () => {
        try {
          await simulateWriteOperation();
          return new Response(501, {}, { error: 'Not implemented' });
        } catch (error) {
          return new Response(500, {}, { error: error instanceof Error ? error.message : 'Server error' });
        }
      });

      this.post('/jobs/:id/reorder', async () => {
        try {
          await simulateWriteOperation();
          return new Response(501, {}, { error: 'Not implemented' });
        } catch (error) {
          return new Response(500, {}, { error: error instanceof Error ? error.message : 'Server error' });
        }
      });

      // Candidates endpoints
      this.get('/candidates', async (_schema, request) => {
        const queryParams = request.queryParams || {};
        const search = Array.isArray(queryParams.search) ? queryParams.search[0] : (queryParams.search || '');
        const stage = Array.isArray(queryParams.stage) ? queryParams.stage[0] : (queryParams.stage || '');
        const page = Array.isArray(queryParams.page) ? queryParams.page[0] : (queryParams.page || '1');
        const pageSize = Array.isArray(queryParams.pageSize) ? queryParams.pageSize[0] : (queryParams.pageSize || '20');
        
        try {
          const data = await loadData();
          let candidates = [...data.candidates];
          
          // Sort by createdAt desc
          candidates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          // Filter
          if (search) {
            candidates = candidates.filter(candidate => 
              candidate.name.toLowerCase().includes(search.toLowerCase()) ||
              candidate.email.toLowerCase().includes(search.toLowerCase())
            );
          }
          
          if (stage) {
            candidates = candidates.filter(candidate => candidate.stage === stage);
          }
          
          // Paginate
          const total = candidates.length;
          const pageNum = parseInt(page);
          const pageSizeNum = parseInt(pageSize);
          const totalPages = Math.ceil(total / pageSizeNum);
          const startIndex = (pageNum - 1) * pageSizeNum;
          const paginatedCandidates = candidates.slice(startIndex, startIndex + pageSizeNum);
          
          return {
            data: paginatedCandidates,
            pagination: {
              page: pageNum,
              pageSize: pageSizeNum,
              total,
              totalPages,
              hasNext: startIndex + pageSizeNum < total,
              hasPrev: pageNum > 1,
            }
          };
        } catch {
          return new Response(500, {}, { error: 'Database error' });
        }
      });

      this.put('/candidates/:id', async (_schema, request) => {
        try {
          // Simulate network latency and potential errors
          await simulateWriteOperation();
          
          const candidateId = request.params.id;
          const updates = JSON.parse(request.requestBody || '{}');
          
          // Find candidate in IndexedDB and update
          const candidate = await db.candidates.get(candidateId);
          if (!candidate) {
            return new Response(404, {}, { error: 'Candidate not found' });
          }
          
          const updatedCandidate = {
            ...candidate,
            ...updates,
            updatedAt: new Date()
          };
          
          await db.candidates.put(updatedCandidate);
          
          // Update cache
          if (dataCache) {
            const index = dataCache.candidates.findIndex(c => c.id === candidateId);
            if (index !== -1) {
              dataCache.candidates[index] = updatedCandidate;
            }
          }
          
          return updatedCandidate;
        } catch (error) {
          return new Response(500, {}, { error: error instanceof Error ? error.message : 'Database error' });
        }
      });

      this.get('/candidates/:id/timeline', async (_schema, request) => {
        try {
          const data = await loadData();
          const timeline = data.timeline
            .filter(item => item.candidateId === request.params.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return timeline;
        } catch {
          return new Response(500, {}, { error: 'Database error' });
        }
      });

      // Assessments endpoints
      this.get('/assessments/:jobId', async (_schema, request) => {
        try {
          const data = await loadData();
          const assessment = data.assessments.find(a => a.jobId === request.params.jobId);
          return assessment || null;
        } catch {
          return new Response(500, {}, { error: 'Database error' });
        }
      });

      this.post('/assessments/:jobId', async () => {
        try {
          await simulateWriteOperation();
          return new Response(501, {}, { error: 'Not implemented' });
        } catch (error) {
          return new Response(500, {}, { error: error instanceof Error ? error.message : 'Server error' });
        }
      });
    },
  });
}