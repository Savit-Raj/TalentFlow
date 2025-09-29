import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus, Eye, Settings, BarChart3 } from 'lucide-react';
import ButtonExports from '@/components/ui/button';
const { Button } = ButtonExports;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import AssessmentBuilder from './AssessmentBuilder';
import AssessmentPreview from './AssessmentPreview';
import AssignmentManager from './AssignmentManager';
import AssessmentAnalysis from './AssessmentAnalysis';
import { JobsApi, AssessmentsApi } from '@/lib/api';
import type { Job, Assessment } from '@/lib/database';

const AssessmentsBoard = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'builder' | 'preview' | 'assignments' | 'analysis'>('builder');
  const [isAssessmentSent, setIsAssessmentSent] = useState(false);
  const [timerState, setTimerState] = useState<{ timeRemaining: number; isTimeUp: boolean; isSubmitted: boolean }>({ timeRemaining: 120, isTimeUp: false, isSubmitted: false });

  // Fetch active jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const result = await JobsApi.getJobs({ status: 'active', pageSize: 100 });
        if (result.error) throw new Error(result.error.message);
        setJobs(result.data.data);
        if (result.data.data.length > 0 && !selectedJobId) {
          setSelectedJobId(result.data.data[0].id);
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load jobs',
          variant: 'destructive',
        });
      }
    };
    fetchJobs();
  }, [toast, selectedJobId]);

  // Fetch assessment for selected job
  useEffect(() => {
    if (!selectedJobId) return;
    
    const fetchAssessment = async () => {
      setIsLoading(true);
      try {
        const result = await AssessmentsApi.getAssessment(selectedJobId);
        if (result.error) throw new Error(result.error.message);
        setAssessment(result.data);
      } catch (error) {
        console.error('Error fetching assessment:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssessment();
  }, [selectedJobId]);

  const handleSaveAssessment = useCallback(async (assessmentData: Partial<Assessment>) => {
    if (!selectedJobId) return;
    
    try {
      const result = await AssessmentsApi.saveAssessment(selectedJobId, assessmentData);
      if (result.error) throw new Error(result.error.message);
      
      setAssessment(result.data);
      toast({
        title: 'Assessment Saved',
        description: 'Assessment has been saved successfully.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save assessment',
        variant: 'destructive',
      });
    }
  }, [selectedJobId, toast]);

  const selectedJob = jobs.find(job => job.id === selectedJobId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <ClipboardList className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assessments</h1>
          <p className="text-muted-foreground">Create and manage job-specific assessments</p>
        </div>
      </div>

      {/* Job Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Job</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a job to create assessment" />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedJobId && (
        <>
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTab === 'builder' ? 'default' : 'outline'}
              onClick={() => setActiveTab('builder')}
              className="flex-1 sm:flex-none"
            >
              <Settings className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="xs:inline">Builder</span>
            </Button>
            <Button
              variant={activeTab === 'preview' ? 'default' : 'outline'}
              onClick={() => setActiveTab('preview')}
              disabled={!assessment || assessment.sections.length === 0}
              className="flex-1 sm:flex-none"
            >
              <Eye className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="xs:inline">Preview</span>
            </Button>
            <Button
              variant={activeTab === 'assignments' ? 'default' : 'outline'}
              onClick={() => setActiveTab('assignments')}
              disabled={!assessment || assessment.sections.length === 0}
              className="flex-1 sm:flex-none"
            >
              <Plus className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="xs:inline">Assignments</span>
              {assessment && !assessment.isActive && (
                <span className="ml-1 text-xs bg-yellow-500 text-white px-1 rounded hidden sm:inline">Inactive</span>
              )}
            </Button>
            <Button
              variant={activeTab === 'analysis' ? 'default' : 'outline'}
              onClick={() => setActiveTab('analysis')}
              className="flex-1 sm:flex-none"
            >
              <BarChart3 className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="xs:inline">Analysis</span>
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'builder' && (
            <AssessmentBuilder
              job={selectedJob!}
              assessment={assessment}
              onSave={handleSaveAssessment}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'preview' && assessment && (
            <AssessmentPreview 
              assessment={assessment} 
              showTimer={isAssessmentSent} 
              timerState={timerState}
              onTimerUpdate={setTimerState}
            />
          )}

          {activeTab === 'assignments' && assessment && (
            <AssignmentManager 
              jobId={selectedJobId} 
              assessment={assessment} 
              onAssessmentSent={() => {
                setIsAssessmentSent(true);
                setTimerState({ timeRemaining: 120, isTimeUp: false, isSubmitted: false });
              }}
            />
          )}

          {activeTab === 'analysis' && (
            <AssessmentAnalysis />
          )}
        </>
      )}
    </div>
  );
};

export default AssessmentsBoard;