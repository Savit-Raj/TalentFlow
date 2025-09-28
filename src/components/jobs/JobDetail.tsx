/**
 * Job Detail Component
 * Displays detailed view of a single job posting
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, DollarSign, Calendar, Edit, Archive, RotateCcw } from 'lucide-react';
import ButtonExports from '@/components/ui/button';
const { Button } = ButtonExports;
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

import JobModal from './JobModal';
import { JobsApi } from '@/lib/api';
import type { Job } from '@/lib/database';

const JobDetail = () => {
  const { jobNumber } = useParams<{ jobNumber: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Fetch job data
  useEffect(() => {
    const fetchJob = async () => {
      if (!jobNumber) return;

      setIsLoading(true);
      try {
        const result = await JobsApi.getJobByNumber(jobNumber);
        
        if (result.error) {
          throw new Error(result.error.message);
        }

        if (!result.data) {
          navigate('/jobs', { replace: true });
          return;
        }

        setJob(result.data);
      } catch (error) {
        console.error('Error fetching job:', error);
        toast({
          title: 'Error',
          description: 'Failed to load job details. Please try again.',
          variant: 'destructive',
        });
        navigate('/jobs', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [jobNumber, navigate, toast]);

  // Handle job editing
  const handleJobSave = async (jobData: Partial<Job>) => {
    if (!job) return;

    try {
      const result = await JobsApi.updateJob(job.id, jobData);
      if (result.error) throw new Error(result.error.message);

      setJob(result.data);
      setIsModalOpen(false);
      
      toast({
        title: 'Job Updated',
        description: 'Job has been updated successfully.',
      });
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save job. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle archive/unarchive
  const handleArchiveToggle = async () => {
    if (!job) return;

    setIsArchiving(true);
    try {
      const newStatus = job.status === 'active' ? 'archived' : 'active';
      const result = await JobsApi.updateJob(job.id, { status: newStatus });
      
      if (result.error) throw new Error(result.error.message);

      setJob(result.data);
      
      toast({
        title: job.status === 'active' ? 'Job Archived' : 'Job Unarchived',
        description: `${job.title} has been ${newStatus === 'archived' ? 'archived' : 'restored to active status'}.`,
      });
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update job status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const formatSalary = (salary?: Job['salary']) => {
    if (!salary) return null;
    return `$${salary.min.toLocaleString()} - $${salary.max.toLocaleString()} ${salary.currency}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/jobs')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Jobs</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="font-mono">
              #{job.jobNumber}
            </Badge>
            <Badge className={job.status === 'active' ? 'status-active' : 'status-archived'}>
              {job.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Job</span>
          </Button>
          
          <Button
            variant={job.status === 'active' ? 'destructive' : 'default'}
            onClick={handleArchiveToggle}
            disabled={isArchiving}
            className="flex items-center space-x-2"
          >
            {job.status === 'active' ? (
              <>
                <Archive className="h-4 w-4" />
                <span>Archive</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                <span>Unarchive</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Job Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{job.title}</CardTitle>
          
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            {job.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{job.location}</span>
              </div>
            )}
            
            {job.salary && (
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4" />
                <span>{formatSalary(job.salary)}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Posted {job.createdAt.toLocaleDateString()}</span>
            </div>
            
            {job.type && (
              <Badge variant="outline">
                {job.type.replace('-', ' ')}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Job Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Requirements</h3>
              <ul className="space-y-2">
                {job.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-muted-foreground">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills & Technologies */}
          {job.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Skills & Technologies</h3>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <JobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleJobSave}
        job={job}
      />
    </div>
  );
};

export default JobDetail;