/**
 * Candidate Card Component
 * Displays individual candidate information in a professional card format
 * 
 * Features:
 * - Professional card design with hover effects
 * - Stage badges with semantic colors
 * - Skills display
 * - Quick stage update dropdown
 * - Click to navigate to profile
 */

import { useState, useEffect } from 'react';
import { MoreHorizontal, Mail, Phone, MapPin, Briefcase, GraduationCap, Building2, ExternalLink } from 'lucide-react';
import ButtonExports from '@/components/ui/button';
const { Button } = ButtonExports;
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { JobsApi } from '@/lib/api';
import type { Candidate, Job } from '@/lib/database';

interface CandidateCardProps {
  candidate: Candidate;
  onStageUpdate: (candidateId: string, newStage: Candidate['stage']) => void;
  onClick: () => void;
}

const CandidateCard = ({ candidate, onStageUpdate, onClick }: CandidateCardProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [job, setJob] = useState<Job | null>(null);

  // Fetch job information
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const result = await JobsApi.getJobById(candidate.jobId);
        if (result.data) {
          setJob(result.data);
        }
      } catch (error) {
        console.error('Error fetching job:', error);
      }
    };

    fetchJob();
  }, [candidate.jobId]);

  const handleStageUpdate = async (newStage: Candidate['stage']) => {
    if (newStage === candidate.stage) return;
    
    setIsUpdating(true);
    try {
      await onStageUpdate(candidate.id, newStage);
    } finally {
      setIsUpdating(false);
    }
  };

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

  return (
    <Card className="card-interactive group cursor-pointer hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0 self-center sm:self-start">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {getInitials(candidate.name)}
              </span>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0" onClick={onClick}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
              <div className="space-y-1 flex-1">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {candidate.name}
                </h3>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{candidate.email}</span>
                  </div>
                  
                  {candidate.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                </div>

                {/* Job Information */}
                {job && (
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-1">
                    <Building2 className="h-3 w-3" />
                    <span className="font-medium text-primary">#{job.jobNumber}</span>
                    <span>-</span>
                    <span className="truncate">{job.title}</span>
                  </div>
                )}

                {/* Platform Information */}
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                  <span>Applied via {candidate.platform}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm text-muted-foreground">
                  {candidate.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{candidate.location}</span>
                    </div>
                  )}
                  
                  {candidate.experience && (
                    <div className="flex items-center space-x-1">
                      <Briefcase className="h-3 w-3" />
                      <span>{candidate.experience} years exp</span>
                    </div>
                  )}
                  
                  {candidate.education && (
                    <div className="flex items-center space-x-1">
                      <GraduationCap className="h-3 w-3" />
                      <span className="truncate">{candidate.education}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end space-x-2 mt-2 sm:mt-0">
                <Badge className={getStageColor(candidate.stage)}>
                  {getStageLabel(candidate.stage)}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isUpdating}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStageUpdate('applied'); }}>
                      Move to Applied
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStageUpdate('screen'); }}>
                      Move to Screening
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStageUpdate('tech'); }}>
                      Move to Technical
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStageUpdate('offer'); }}>
                      Move to Offer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStageUpdate('hired'); }}>
                      Mark as Hired
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStageUpdate('rejected'); }}>
                      Mark as Rejected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Skills */}
            {candidate.skills && candidate.skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {candidate.skills.slice(0, 4).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {candidate.skills.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{candidate.skills.length - 4} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CandidateCard;