/**
 * Candidate Profile Component
 * Detailed view of individual candidate with timeline and notes
 * 
 * Features:
 * - Comprehensive candidate information
 * - Timeline of interactions
 * - Notes with @mention support
 * - Stage management
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, GraduationCap, Calendar } from 'lucide-react';

import ButtonExports from '@/components/ui/button';
const { Button } = ButtonExports;
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';

import NotesSection from './NotesSection';
import TimelineSection from './TimelineSection';
import { CandidatesApi } from '@/lib/api';
import { db } from '@/lib/database';
import type { Candidate, TimelineEntry } from '@/lib/database';

const CandidateProfile = () => {
  const { email } = useParams<{ email: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch candidate by email
  const fetchCandidate = useCallback(async () => {
    if (!email) return;

    setIsLoading(true);
    try {
      const decodedEmail = decodeURIComponent(email);
      const candidateData = await db.candidates.where('email').equals(decodedEmail).first();
      
      if (!candidateData) {
        toast({
          title: 'Candidate Not Found',
          description: 'The requested candidate could not be found.',
          variant: 'destructive',
        });
        navigate('/candidates');
        return;
      }

      setCandidate(candidateData);

      // Fetch timeline
      const timelineResult = await CandidatesApi.getCandidateTimeline(candidateData.id);
      if (timelineResult.data) {
        setTimeline(timelineResult.data as TimelineEntry[]);
      }
    } catch (error) {
      console.error('Error fetching candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to load candidate profile.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, navigate, toast]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  // Handle stage update
  const handleStageUpdate = useCallback(async (newStage: Candidate['stage']) => {
    if (!candidate || newStage === candidate.stage) return;

    setIsUpdating(true);
    try {
      const result = await CandidatesApi.updateCandidate(candidate.id, { stage: newStage });
      if (result.error) throw new Error(result.error.message);

      setCandidate(prev => prev ? { ...prev, stage: newStage, updatedAt: new Date() } : null);
      
      toast({
        title: 'Stage Updated',
        description: 'Candidate stage has been updated successfully.',
      });

      // Refresh timeline to show the new entry
      fetchCandidate();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update candidate stage.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  }, [candidate, toast, fetchCandidate]);

  // Handle note addition
  const handleAddNote = useCallback(async (note: string) => {
    if (!candidate) return;

    try {
      // Add note to candidate
      const updatedNotes = [...candidate.notes, note];
      const result = await CandidatesApi.updateCandidate(candidate.id, { notes: updatedNotes });
      
      if (result.error) throw new Error(result.error.message);

      setCandidate(prev => prev ? { ...prev, notes: updatedNotes } : null);
      
      toast({
        title: 'Note Added',
        description: 'Note has been added successfully.',
      });

      // Refresh timeline
      fetchCandidate();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add note.',
        variant: 'destructive',
      });
    }
  }, [candidate, toast, fetchCandidate]);

  const getStageColor = (stage: Candidate['stage']) => {
    const colors = {
      applied: 'bg-blue-100 text-blue-800 border-blue-200',
      screen: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      tech: 'bg-purple-100 text-purple-800 border-purple-200',
      offer: 'bg-orange-100 text-orange-800 border-orange-200',
      hired: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[stage] || colors.applied;
  };

  const getStageLabel = (stage: Candidate['stage']) => {
    const labels = {
      applied: 'Applied',
      screen: 'Screening',
      tech: 'Technical',
      offer: 'Offer',
      hired: 'Hired',
      rejected: 'Rejected',
    };
    return labels[stage];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-32" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">Candidate Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested candidate could not be found.</p>
        <Button onClick={() => navigate('/candidates')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Candidates
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/candidates')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">
                {getInitials(candidate.name)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{candidate.name}</h1>
              <p className="text-muted-foreground">{candidate.email}</p>
            </div>
          </div>
        </div>

        <Badge className={getStageColor(candidate.stage)}>
          {getStageLabel(candidate.stage)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate Information */}
          <Card>
            <CardHeader>
              <CardTitle>Candidate Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{candidate.email}</span>
                </div>
                
                {candidate.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{candidate.phone}</span>
                  </div>
                )}
                
                {candidate.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{candidate.location}</span>
                  </div>
                )}
                
                {candidate.experience && (
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{candidate.experience} years experience</span>
                  </div>
                )}
                
                {candidate.education && (
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{candidate.education}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Applied {candidate.createdAt.toLocaleDateString()}</span>
                </div>
              </div>

              {/* Skills */}
              {candidate.skills && candidate.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <TimelineSection timeline={timeline} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stage Management */}
          <Card>
            <CardHeader>
              <CardTitle>Stage Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'].map((stage) => (
                <Button
                  key={stage}
                  variant={candidate.stage === stage ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleStageUpdate(stage as Candidate['stage'])}
                  disabled={isUpdating}
                >
                  {getStageLabel(stage as Candidate['stage'])}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Notes */}
          <NotesSection
            notes={candidate.notes}
            onAddNote={handleAddNote}
          />
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;