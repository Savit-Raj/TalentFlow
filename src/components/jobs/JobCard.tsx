/**
 * Job Card Component
 * Displays individual job information in a professional card format
 * 
 * Features:
 * - Professional card design with hover effects
 * - Status badges with semantic colors
 * - Tag display for skills/technologies
 * - Salary and location information
 * - Action buttons for edit/archive operations
 * - Drag handle for reordering
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, MapPin, Edit, Archive, RotateCcw, GripVertical } from 'lucide-react';
import ButtonExports from '@/components/ui/button';
const { Button } = ButtonExports;
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { Job } from '@/lib/database';

interface JobCardProps {
  job: Job;
  onEdit: (job: Job) => void;
  onArchive: (jobId: string) => void;
  onUnarchive: (jobId: string) => void;
  isDragging?: boolean;
}

const JobCard = ({ job, onEdit, onArchive, onUnarchive, isDragging }: JobCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      if (job.status === 'active') {
        await onArchive(job.id);
        toast({
          title: 'Job Archived',
          description: `${job.title} has been archived successfully.`,
        });
      } else {
        await onUnarchive(job.id);
        toast({
          title: 'Job Unarchived',
          description: `${job.title} has been restored to active status.`,
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update job status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatSalary = (salary?: Job['salary']) => {
    if (!salary) return null;
    const currencySymbols = { USD: '$', EUR: '€', INR: '₹' };
    const symbol = currencySymbols[salary.currency as keyof typeof currencySymbols] || salary.currency;
    return `${symbol}${salary.min.toLocaleString()} - ${symbol}${salary.max.toLocaleString()}`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on dropdown or drag handle
    const target = e.target as HTMLElement;
    if (target.closest('[data-dropdown-trigger]') || 
        target.closest('[role="menu"]') ||
        target.closest('.grip-handle')) {
      return;
    }
    navigate(`/jobs/${job.jobNumber}`);
  };

  return (
    <Card 
      className={`card-interactive group relative cursor-pointer ${isDragging ? 'opacity-50 scale-95' : ''}`}
      onClick={handleCardClick}
    >
      {/* Drag Handle */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing grip-handle">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <CardHeader className="pb-3 pl-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              <Badge variant="outline" className="text-xs font-mono">
                #{job.jobNumber}
              </Badge>
              <Badge className={job.status === 'active' ? 'status-active' : 'status-archived'}>
                {job.status}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {job.description}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                data-dropdown-trigger
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(job);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Job
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  handleArchive();
                }} 
                disabled={isLoading}
              >
                {job.status === 'active' ? (
                  <>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive Job
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Unarchive Job
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pl-8 space-y-4">
        {/* Tags */}
        {job.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {job.tags.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{job.tags.length - 4} more
              </Badge>
            )}
          </div>
        )}

        {/* Job Details */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            {job.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>{job.location}</span>
              </div>
            )}
            {job.salary && (
              <div className="flex items-center space-x-1">
                <span>{formatSalary(job.salary)}</span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            {job.type && (
              <Badge variant="outline" className="text-xs">
                {job.type.replace('-', ' ')}
              </Badge>
            )}
          </div>
        </div>

        {/* Creation Date */}
        <div className="text-xs text-muted-foreground">
          Created {job.createdAt.toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;