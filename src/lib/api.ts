/**
 * API Client - HTTP-based communication with MirageJS server
 * Replaces direct IndexedDB access with proper frontend-backend communication
 */

import type { Job, Candidate, Assessment } from './database';

interface ApiResponse<T> {
  data: T;
  error?: never;
}

interface ApiError {
  data?: never;
  error: {
    status: number;
    message: string;
  };
}

type ApiResult<T> = ApiResponse<T> | ApiError;

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResult<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: {
            status: response.status,
            message: errorData.error || `HTTP ${response.status}`,
          },
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: {
          status: 0,
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  // Jobs API
  async getJobs(params: {
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  } = {}): Promise<ApiResult<PaginatedResponse<Job>>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const result = await this.request<PaginatedResponse<Job>>(`/jobs?${searchParams}`);
    
    if (result.data) {
      // Convert date strings back to Date objects
      result.data.data = result.data.data.map(job => ({
        ...job,
        createdAt: new Date(job.createdAt),
        updatedAt: new Date(job.updatedAt)
      }));
    }
    
    return result;
  }

  async getJobByNumber(jobNumber: string): Promise<ApiResult<Job | null>> {
    const result = await this.request<Job | null>(`/jobs/${jobNumber}`);
    
    if (result.data) {
      // Convert date strings back to Date objects
      result.data = {
        ...result.data,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt)
      };
    }
    
    return result;
  }

  async getJobById(jobId: string): Promise<ApiResult<Job | null>> {
    const result = await this.request<Job | null>(`/jobs/id/${jobId}`);
    
    if (result.data) {
      // Convert date strings back to Date objects
      result.data = {
        ...result.data,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt)
      };
    }
    
    return result;
  }

  async createJob(jobData: Partial<Job>): Promise<ApiResult<Job>> {
    return this.request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async updateJob(jobId: string, updates: Partial<Job>): Promise<ApiResult<Job>> {
    const result = await this.request<Job>(`/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    if (result.data) {
      // Convert date strings back to Date objects
      result.data = {
        ...result.data,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt)
      };
    }
    
    return result;
  }

  async reorderJob(jobId: string, fromOrder: number, toOrder: number): Promise<ApiResult<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/jobs/${jobId}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ fromOrder, toOrder }),
    });
  }

  // Candidates API
  async getCandidates(params: {
    search?: string;
    stage?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<ApiResult<PaginatedResponse<Candidate>>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<PaginatedResponse<Candidate>>(`/candidates?${searchParams}`);
  }

  async updateCandidate(candidateId: string, updates: Partial<Candidate>): Promise<ApiResult<Candidate>> {
    const result = await this.request<Candidate>(`/candidates/${candidateId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    if (result.data) {
      // Convert date strings back to Date objects
      result.data = {
        ...result.data,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt)
      };
    }
    
    return result;
  }

  async getCandidateTimeline(candidateId: string): Promise<ApiResult<unknown[]>> {
    const result = await this.request<unknown[]>(`/candidates/${candidateId}/timeline`);
    
    if (result.data) {
      // Convert date strings back to Date objects
      result.data = result.data.map((item: unknown) => ({
        ...(item as Record<string, unknown>),
        createdAt: new Date((item as { createdAt: string }).createdAt)
      }));
    }
    
    return result;
  }

  // Assessments API
  async getAssessment(jobId: string): Promise<ApiResult<Assessment | null>> {
    return this.request<Assessment | null>(`/assessments/${jobId}`);
  }

  async saveAssessment(jobId: string, assessmentData: Partial<Assessment>): Promise<ApiResult<Assessment>> {
    return this.request<Assessment>(`/assessments/${jobId}`, {
      method: 'POST',
      body: JSON.stringify(assessmentData),
    });
  }
}

// Export API instances
const apiClient = new ApiClient();

export const JobsApi = {
  getJobs: apiClient.getJobs.bind(apiClient),
  getJobByNumber: apiClient.getJobByNumber.bind(apiClient),
  getJobById: apiClient.getJobById.bind(apiClient),
  createJob: apiClient.createJob.bind(apiClient),
  updateJob: apiClient.updateJob.bind(apiClient),
  reorderJob: apiClient.reorderJob.bind(apiClient),
};

export const CandidatesApi = {
  getCandidates: apiClient.getCandidates.bind(apiClient),
  updateCandidate: apiClient.updateCandidate.bind(apiClient),
  getCandidateTimeline: apiClient.getCandidateTimeline.bind(apiClient),
};

export const AssessmentsApi = {
  getAssessment: apiClient.getAssessment.bind(apiClient),
  saveAssessment: apiClient.saveAssessment.bind(apiClient),
};