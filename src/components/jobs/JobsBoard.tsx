/**
 * Jobs Board Component
 * Main interface for managing job postings with advanced features
 * 
 * Features:
 * - Server-like pagination with URL state
 * - Real-time search and filtering
 * - Drag-and-drop reordering with optimistic updates
 * - Create/Edit job modal
 * - Archive/Unarchive functionality
 * - Loading states and error handling
 * - Responsive grid layout
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ButtonExports from '@/components/ui/button';
const { Button } = ButtonExports;
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

import JobCard from './JobCard';
import JobModal from './JobModal';
import { JobsApi } from '@/lib/api';
import type { Job } from '@/lib/database';

// Sortable wrapper for drag-and-drop
const SortableJobCard = ({ job, onEdit, onArchive, onUnarchive }: {
  job: Job;
  onEdit: (job: Job) => void;
  onArchive: (jobId: string) => void;
  onUnarchive: (jobId: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: job.id,
    data: {
      type: 'job',
      job,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Create filtered listeners that exclude dropdown menu interactions
  const dragListeners = {
    ...listeners,
    onPointerDown: (event: React.PointerEvent) => {
      // Don't start drag if clicking on dropdown menu or its children
      const target = event.target as HTMLElement;
      if (target.closest('[data-radix-popper-content-wrapper]') || 
          target.closest('[role="menu"]') ||
          target.closest('button[role="menuitem"]') ||
          target.closest('[data-dropdown-trigger]')) {
        return;
      }
      listeners?.onPointerDown?.(event as React.PointerEvent<Element>);
    },
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...dragListeners}>
      <JobCard
        job={job}
        onEdit={onEdit}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
        isDragging={isDragging}
      />
    </div>
  );
};

const JobsBoard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // State management
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // URL-based filters
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'order';
  const order = searchParams.get('order') || 'asc';

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update URL params helper
  const updateSearchParams = useCallback((updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Fetch jobs from direct API
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await JobsApi.getJobs({
        page,
        pageSize: pagination.pageSize,
        sort,
        order: order as 'asc' | 'desc',
        search: search || undefined,
        status: status || undefined,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      setJobs(result.data.data);
      setPagination(result.data.pagination);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load jobs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, pagination.pageSize, sort, order, search, status, toast]);

  // Load jobs when filters change
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Handle search input with debouncing
  const handleSearchChange = useCallback((value: string) => {
    updateSearchParams({ search: value, page: '1' });
  }, [updateSearchParams]);

  // Handle status filter change
  const handleStatusChange = useCallback((value: string) => {
    updateSearchParams({ status: value === 'all' ? null : value, page: '1' });
  }, [updateSearchParams]);

  // Handle sorting change
  const handleSortChange = useCallback((newSort: string) => {
    const newOrder = sort === newSort && order === 'asc' ? 'desc' : 'asc';
    updateSearchParams({ sort: newSort, order: newOrder });
  }, [sort, order, updateSearchParams]);

  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    updateSearchParams({ page: newPage.toString() });
  }, [updateSearchParams]);

  // Handle job creation/editing
  const handleJobSave = useCallback(async (jobData: Partial<Job>) => {
    try {
      let result;
      if (editingJob) {
        // Update existing job
        result = await JobsApi.updateJob(editingJob.id, jobData);
        if (result.error) throw new Error(result.error.message);

        toast({
          title: 'Job Updated',
          description: 'Job has been updated successfully.',
        });
      } else {
        // Create new job
        result = await JobsApi.createJob(jobData);
        if (result.error) throw new Error(result.error.message);

        toast({
          title: 'Job Created',
          description: 'New job has been created successfully.',
        });
      }

      setIsModalOpen(false);
      setEditingJob(null);
      fetchJobs(); // Refresh the list
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save job. Please try again.',
        variant: 'destructive',
      });
    }
  }, [editingJob, toast, fetchJobs]);

  // Handle job archiving
  const handleArchive = useCallback(async (jobId: string) => {
    // Optimistic update
    const originalJobs = jobs;
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'archived' as const } : job
    ));

    try {
      const result = await JobsApi.updateJob(jobId, { status: 'archived' });
      if (result.error) {
        // Rollback on failure
        setJobs(originalJobs);
        throw new Error(result.error.message);
      }
    } catch (error: unknown) {
      // Rollback on failure
      setJobs(originalJobs);
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [jobs]);

  // Handle job unarchiving
  const handleUnarchive = useCallback(async (jobId: string) => {
    // Optimistic update
    const originalJobs = jobs;
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'active' as const } : job
    ));

    try {
      const result = await JobsApi.updateJob(jobId, { status: 'active' });
      if (result.error) {
        // Rollback on failure
        setJobs(originalJobs);
        throw new Error(result.error.message);
      }
    } catch (error: unknown) {
      // Rollback on failure
      setJobs(originalJobs);
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [jobs]);

  // Handle drag and drop reordering
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = jobs.findIndex((job) => job.id === active.id);
    const newIndex = jobs.findIndex((job) => job.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update
    const newJobs = arrayMove(jobs, oldIndex, newIndex);
    setJobs(newJobs);

    try {
      const result = await JobsApi.reorderJob(
        active.id as string,
        jobs[oldIndex].order,
        jobs[newIndex].order
      );

      if (result.error) {
        // Rollback on failure
        setJobs(jobs);
        throw new Error(result.error.message);
      }

      toast({
        title: 'Jobs Reordered',
        description: 'Job order has been updated successfully.',
      });
    } catch {
      toast({
        title: 'Reorder Failed',
        description: 'Failed to update job order. Changes have been reverted.',
        variant: 'destructive',
      });
    }
  }, [jobs, toast]);

  // Handle job editing
  const handleEdit = useCallback((job: Job) => {
    setEditingJob(job);
    setIsModalOpen(true);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditingJob(null);
  }, []);

  // Memoized job IDs for DnD
  const jobIds = useMemo(() => jobs.map(job => job.id), [jobs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Jobs Board</h1>
          <p className="text-muted-foreground">Manage your job postings and track applications</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by title or tags..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={status || 'all'} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Button
              variant="outline"
              onClick={() => handleSortChange('order')}
              className="w-full sm:w-auto"
            >
              {order === 'asc' ? <SortAsc className="mr-2 h-4 w-4" /> : <SortDesc className="mr-2 h-4 w-4" />}
              Order
            </Button>

            <Button
              variant="outline"
              onClick={() => handleSortChange('createdAt')}
              className="w-full sm:w-auto"
            >
              {order === 'asc' ? <SortAsc className="mr-2 h-4 w-4" /> : <SortDesc className="mr-2 h-4 w-4" />}
              Date
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground mb-4">
                {search || status ? 'Try adjusting your filters' : 'Create your first job posting'}
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Job
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={jobIds} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <SortableJobCard
                  key={job.id}
                  job={job}
                  onEdit={handleEdit}
                  onArchive={handleArchive}
                  onUnarchive={handleUnarchive}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} jobs
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Job Modal */}
      <JobModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleJobSave}
        job={editingJob}
      />
    </div>
  );
};

export default JobsBoard;