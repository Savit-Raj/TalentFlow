/**
 * Candidates Kanban Board Component
 * Drag-and-drop interface for managing candidate stages
 * 
 * Features:
 * - Drag-and-drop between stages
 * - Stage columns with counts
 * - Compact candidate cards
 * - Optimistic updates
 */

import { useMemo } from 'react';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
// import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import type { Candidate } from '@/lib/database';

interface CandidatesKanbanProps {
  candidates: Candidate[];
  onStageUpdate: (candidateId: string, newStage: Candidate['stage']) => void;
  onCandidateClick: (candidate: Candidate) => void;
}

// Sortable candidate card for drag-and-drop
const SortableCandidateCard = ({ 
  candidate, 
  onCandidateClick 
}: { 
  candidate: Candidate; 
  onCandidateClick: (candidate: Candidate) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`mb-3 ${isDragging ? 'opacity-50' : ''}`}
    >
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow duration-200"
        onClick={() => onCandidateClick(candidate)}
      >
        <CardContent className="p-3">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {getInitials(candidate.name)}
                </span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate">
                {candidate.name}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {candidate.email}
              </p>
              
              {candidate.skills && candidate.skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {candidate.skills.slice(0, 2).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs px-1 py-0">
                      {skill}
                    </Badge>
                  ))}
                  {candidate.skills.length > 2 && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      +{candidate.skills.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CandidatesKanban = ({ candidates, onStageUpdate, onCandidateClick }: CandidatesKanbanProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group candidates by stage
  const candidatesByStage = useMemo(() => {
    const stages: Candidate['stage'][] = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];
    
    return stages.reduce((acc, stage) => {
      acc[stage] = candidates.filter(candidate => candidate.stage === stage);
      return acc;
    }, {} as Record<Candidate['stage'], Candidate[]>);
  }, [candidates]);

  // Stage configuration
  const stageConfig = {
    applied: { title: 'Applied', color: 'bg-blue-50 border-blue-200' },
    screen: { title: 'Screening', color: 'bg-yellow-50 border-yellow-200' },
    tech: { title: 'Technical', color: 'bg-purple-50 border-purple-200' },
    offer: { title: 'Offer', color: 'bg-orange-50 border-orange-200' },
    hired: { title: 'Hired', color: 'bg-green-50 border-green-200' },
    rejected: { title: 'Rejected', color: 'bg-red-50 border-red-200' },
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const candidateId = active.id as string;
    const newStage = over.id as Candidate['stage'];

    // Find the candidate and check if stage actually changed
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate || candidate.stage === newStage) return;

    // Update the candidate stage
    onStageUpdate(candidateId, newStage);
  };



  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Object.entries(stageConfig).map(([stage, config]) => {
          const stageCandidates = candidatesByStage[stage as Candidate['stage']] || [];
          
          return (
            <Card key={stage} className={`${config.color} min-h-[400px]`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>{config.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {stageCandidates.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="min-h-[300px]">
                  <SortableContext 
                    items={stageCandidates.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {stageCandidates.map((candidate) => (
                      <SortableCandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        onCandidateClick={onCandidateClick}
                      />
                    ))}
                  </SortableContext>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DndContext>
  );
};

export default CandidatesKanban;