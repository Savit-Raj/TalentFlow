import { useState, useEffect, useCallback } from 'react';
import { Users, Send, CheckCircle, Clock } from 'lucide-react';
import ButtonExports from '@/components/ui/button';
const { Button } = ButtonExports;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CandidatesApi } from '@/lib/api';
import type { Assessment, Candidate } from '@/lib/database';

interface AssignmentManagerProps {
  jobId: string;
  assessment: Assessment;
}

const AssignmentManager = ({ jobId, assessment }: AssignmentManagerProps) => {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, 'pending' | 'sent' | 'completed'>>({});

  // Fetch eligible candidates (not rejected or hired)
  useEffect(() => {
    const fetchCandidates = async () => {
      setIsLoading(true);
      try {
        const result = await CandidatesApi.getCandidates({ pageSize: 1000 });
        if (result.error) throw new Error(result.error.message);
        
        // Filter candidates for this job who are not rejected or hired
        const eligibleCandidates = result.data.data.filter(candidate => 
          candidate.jobId === jobId && 
          !['rejected', 'hired'].includes(candidate.stage)
        );
        
        setCandidates(eligibleCandidates);
        
        // Initialize assignment status (mock data for demo)
        const mockAssignments: Record<string, 'pending' | 'sent' | 'completed'> = {};
        eligibleCandidates.forEach(candidate => {
          const random = Math.random();
          if (random < 0.3) {
            mockAssignments[candidate.id] = 'completed';
          } else if (random < 0.6) {
            mockAssignments[candidate.id] = 'sent';
          } else {
            mockAssignments[candidate.id] = 'pending';
          }
        });
        setAssignments(mockAssignments);
        
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load candidates',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, [jobId, toast]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const pendingCandidates = candidates
        .filter(candidate => assignments[candidate.id] === 'pending')
        .map(candidate => candidate.id);
      setSelectedCandidates(new Set(pendingCandidates));
    } else {
      setSelectedCandidates(new Set());
    }
  }, [candidates, assignments]);

  const handleSelectCandidate = useCallback((candidateId: string, checked: boolean) => {
    setSelectedCandidates(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(candidateId);
      } else {
        newSet.delete(candidateId);
      }
      return newSet;
    });
  }, []);

  const handleSendAssessments = useCallback(async () => {
    if (selectedCandidates.size === 0) return;

    setIsLoading(true);
    try {
      // Mock sending assessments
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update assignment status
      setAssignments(prev => {
        const updated = { ...prev };
        selectedCandidates.forEach(candidateId => {
          updated[candidateId] = 'sent';
        });
        return updated;
      });
      
      setSelectedCandidates(new Set());
      
      toast({
        title: 'Assessments Sent',
        description: `Assessment sent to ${selectedCandidates.size} candidate(s)`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to send assessments',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedCandidates, toast]);

  const getStatusBadge = (status: 'pending' | 'sent' | 'completed') => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'sent':
        return <Badge variant="outline"><Send className="mr-1 h-3 w-3" />Sent</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
    }
  };

  const getStageColor = (stage: Candidate['stage']) => {
    switch (stage) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'screen': return 'bg-yellow-100 text-yellow-800';
      case 'tech': return 'bg-purple-100 text-purple-800';
      case 'offer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingCandidates = candidates.filter(candidate => assignments[candidate.id] === 'pending');
  const sentCandidates = candidates.filter(candidate => assignments[candidate.id] === 'sent');
  const completedCandidates = candidates.filter(candidate => assignments[candidate.id] === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Assignment Manager</CardTitle>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Pending: {pendingCandidates.length}</span>
              <span>Sent: {sentCandidates.length}</span>
              <span>Completed: {completedCandidates.length}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Send the "{assessment.title}" assessment to eligible candidates for this job.
          </p>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {pendingCandidates.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedCandidates.size === pendingCandidates.length && pendingCandidates.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm">
                  Select all pending candidates ({pendingCandidates.length})
                </span>
              </div>
              <Button
                onClick={handleSendAssessments}
                disabled={selectedCandidates.size === 0 || isLoading}
              >
                <Send className="mr-2 h-4 w-4" />
                Send to {selectedCandidates.size} candidate(s)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidates List */}
      <div className="space-y-4">
        {candidates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No eligible candidates</h3>
              <p className="text-muted-foreground text-center">
                There are no candidates for this job who can take the assessment.
                <br />
                Candidates who are rejected or hired are not eligible.
              </p>
            </CardContent>
          </Card>
        ) : (
          candidates.map((candidate) => {
            const status = assignments[candidate.id];
            const isSelectable = status === 'pending';
            const isSelected = selectedCandidates.has(candidate.id);

            return (
              <Card key={candidate.id} className={isSelected ? 'ring-2 ring-primary' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {isSelectable && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => 
                            handleSelectCandidate(candidate.id, checked as boolean)
                          }
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{candidate.name}</h4>
                          <Badge className={getStageColor(candidate.stage)}>
                            {candidate.stage}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{candidate.email}</p>
                        {candidate.skills && candidate.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {candidate.skills.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {candidate.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{candidate.skills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AssignmentManager;