import { useState, useEffect } from 'react';
import { BarChart3, Users, Send, CheckCircle, XCircle, Clock, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { JobsApi, CandidatesApi } from '@/lib/api';
import type { Job } from '@/lib/database';

interface PlatformStats {
  platform: string;
  count: number;
  percentage: number;
}

interface JobAnalysis {
  job: Job;
  totalCandidates: number;
  assessmentSent: number;
  assessmentCompleted: number;
  assessmentFailed: number;
  notReceived: number;
  platformStats: PlatformStats[];
}

const AssessmentAnalysis = () => {
  const { toast } = useToast();
  const [jobAnalytics, setJobAnalytics] = useState<JobAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        // Fetch all jobs
        const jobsResult = await JobsApi.getJobs({ status: 'active', pageSize: 100 });
        if (jobsResult.error) throw new Error(jobsResult.error.message);

        // Fetch all candidates
        const candidatesResult = await CandidatesApi.getCandidates({ pageSize: 1000 });
        if (candidatesResult.error) throw new Error(candidatesResult.error.message);

        const jobs = jobsResult.data.data;
        const candidates = candidatesResult.data.data;

        // Calculate analytics for each job
        const analytics: JobAnalysis[] = jobs.map(job => {
          const jobCandidates = candidates.filter(candidate => candidate.jobId === job.id);
          
          // Mock assignment status based on existing candidate stages
          const totalCandidates = jobCandidates.length;
          const assessmentCompleted = jobCandidates.filter(c => ['offer', 'hired'].includes(c.stage)).length;
          const assessmentFailed = jobCandidates.filter(c => c.stage === 'rejected').length;
          const assessmentSent = jobCandidates.filter(c => ['tech', 'offer', 'hired', 'rejected'].includes(c.stage)).length;
          const notReceived = totalCandidates - assessmentSent;

          // Calculate platform distribution
          const platformCounts = jobCandidates.reduce((acc, candidate) => {
            const platform = candidate.platform || 'Unknown';
            acc[platform] = (acc[platform] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const platformStats: PlatformStats[] = Object.entries(platformCounts)
            .map(([platform, count]) => ({
              platform,
              count,
              percentage: totalCandidates > 0 ? Math.round((count / totalCandidates) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count);

          return {
            job,
            totalCandidates,
            assessmentSent,
            assessmentCompleted,
            assessmentFailed,
            notReceived,
            platformStats
          };
        });

        setJobAnalytics(analytics);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load assessment analytics',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [toast]);

  const getCompletionRate = (completed: number, sent: number) => {
    if (sent === 0) return 0;
    return Math.round((completed / sent) * 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="flex space-x-4">
                  <div className="h-8 bg-muted rounded w-16"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>Assessment Analytics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Overview of assessment performance across all job positions
          </p>
        </CardContent>
      </Card>

      {/* Job Analytics */}
      {jobAnalytics.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground text-center">
              No active jobs found or no candidates have applied yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobAnalytics.map(({ job, totalCandidates, assessmentSent, assessmentCompleted, assessmentFailed, notReceived, platformStats }) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">Job #{job.jobNumber}</p>
                  </div>
                  <Badge variant="outline">
                    {getCompletionRate(assessmentCompleted, assessmentSent)}% completion rate
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {/* Total Candidates */}
                  <div className="flex flex-col items-center space-y-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{totalCandidates}</p>
                      <p className="text-xs text-muted-foreground">Total Candidates</p>
                    </div>
                  </div>

                  {/* Assessment Sent */}
                  <div className="flex flex-col items-center space-y-2">
                    <Send className="h-4 w-4 text-orange-500" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{assessmentSent}</p>
                      <p className="text-xs text-muted-foreground">Assessment Sent</p>
                    </div>
                  </div>

                  {/* Completed */}
                  <div className="flex flex-col items-center space-y-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{assessmentCompleted}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  </div>

                  {/* Failed */}
                  <div className="flex flex-col items-center space-y-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{assessmentFailed}</p>
                      <p className="text-xs text-muted-foreground">Failed/Rejected</p>
                    </div>
                  </div>

                  {/* Not Received */}
                  <div className="flex flex-col items-center space-y-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-600">{notReceived}</p>
                      <p className="text-xs text-muted-foreground">Not Received</p>
                    </div>
                  </div>
                </div>

                {/* Platform Distribution */}
                {platformStats.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <Globe className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-medium">Platform Distribution</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                      {platformStats.map(({ platform, count, percentage }) => (
                        <div key={platform} className="bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-primary">{count}</p>
                          <p className="text-xs text-muted-foreground truncate">{platform}</p>
                          <p className="text-xs text-muted-foreground">{percentage}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                {totalCandidates > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Assessment Progress</span>
                      <span>{assessmentSent}/{totalCandidates} sent</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(assessmentSent / totalCandidates) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssessmentAnalysis;