import { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import ButtonExports from '@/components/ui/button';
const { Button } = ButtonExports;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

import QuestionBuilder from './QuestionBuilder';
import { generateId } from '@/lib/database';
import type { Job, Assessment, AssessmentSection, Question } from '@/lib/database';

interface AssessmentBuilderProps {
  job: Job;
  assessment: Assessment | null;
  onSave: (assessment: Partial<Assessment>) => void;
  isLoading: boolean;
}

const SortableSection = ({ section, onUpdate, onDelete, onQuestionUpdate, onQuestionDelete, onQuestionAdd }: {
  section: AssessmentSection;
  onUpdate: (sectionId: string, updates: Partial<AssessmentSection>) => void;
  onDelete: (sectionId: string) => void;
  onQuestionUpdate: (sectionId: string, questionId: string, updates: Partial<Question>) => void;
  onQuestionDelete: (sectionId: string, questionId: string) => void;
  onQuestionAdd: (sectionId: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div {...attributes} {...listeners} className="cursor-grab">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <Input
                value={section.title}
                onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                placeholder="Section title"
                className="font-semibold"
              />
              <Textarea
                value={section.description || ''}
                onChange={(e) => onUpdate(section.id, { description: e.target.value })}
                placeholder="Section description (optional)"
                rows={2}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(section.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {section.questions.map((question) => (
            <QuestionBuilder
              key={question.id}
              question={question}
              onUpdate={(updates) => onQuestionUpdate(section.id, question.id, updates)}
              onDelete={() => onQuestionDelete(section.id, question.id)}
            />
          ))}
          <Button
            variant="outline"
            onClick={() => onQuestionAdd(section.id)}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const AssessmentBuilder = ({ job, assessment, onSave, isLoading }: AssessmentBuilderProps) => {
  const [title, setTitle] = useState(assessment?.title || `${job.title} Assessment`);
  const [description, setDescription] = useState(assessment?.description || '');
  const [sections, setSections] = useState<AssessmentSection[]>(assessment?.sections || []);
  const [isActive, setIsActive] = useState(assessment?.isActive !== false);

  // Reset state when assessment changes
  useEffect(() => {
    setTitle(assessment?.title || `${job.title} Assessment`);
    setDescription(assessment?.description || '');
    setSections(assessment?.sections || []);
    setIsActive(assessment?.isActive !== false);
  }, [assessment, job.title]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addSection = useCallback(() => {
    const newSection: AssessmentSection = {
      id: generateId(),
      title: 'New Section',
      description: '',
      questions: [],
      order: sections.length + 1,
    };
    setSections(prev => [...prev, newSection]);
  }, [sections.length]);

  const updateSection = useCallback((sectionId: string, updates: Partial<AssessmentSection>) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId ? { ...section, ...updates } : section
    ));
  }, []);

  const deleteSection = useCallback((sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId));
  }, []);

  const addQuestion = useCallback((sectionId: string) => {
    const newQuestion: Question = {
      id: generateId(),
      type: 'short-text',
      title: 'New Question',
      description: '',
      required: false,
      order: 1,
    };

    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, questions: [...section.questions, { ...newQuestion, order: section.questions.length + 1 }] }
        : section
    ));
  }, []);

  const updateQuestion = useCallback((sectionId: string, questionId: string, updates: Partial<Question>) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            questions: section.questions.map(question => 
              question.id === questionId ? { ...question, ...updates } : question
            )
          }
        : section
    ));
  }, []);

  const deleteQuestion = useCallback((sectionId: string, questionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, questions: section.questions.filter(question => question.id !== questionId) }
        : section
    ));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSections(prev => {
      const oldIndex = prev.findIndex(section => section.id === active.id);
      const newIndex = prev.findIndex(section => section.id === over.id);
      return arrayMove(prev, oldIndex, newIndex).map((section, index) => ({
        ...section,
        order: index + 1,
      }));
    });
  }, []);

  const handleSave = useCallback(() => {
    const assessmentData: Partial<Assessment> = {
      title,
      description,
      sections,
      isActive,
    };
    onSave(assessmentData);
  }, [title, description, sections, isActive, onSave]);

  return (
    <div className="space-y-6">
      {/* Assessment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Assessment title"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Assessment description"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked as boolean)}
            />
            <Label htmlFor="isActive">Active (candidates can take this assessment)</Label>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Sections</h3>
          <Button onClick={addSection}>
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>

        {sections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No sections yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first section to start building the assessment
                </p>
                <Button onClick={addSection}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Section
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
            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {sections.map((section) => (
                  <SortableSection
                    key={section.id}
                    section={section}
                    onUpdate={updateSection}
                    onDelete={deleteSection}
                    onQuestionUpdate={updateQuestion}
                    onQuestionDelete={deleteQuestion}
                    onQuestionAdd={addQuestion}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading || sections.length === 0}>
          <Save className="mr-2 h-4 w-4" />
          Save Assessment
        </Button>
      </div>
    </div>
  );
};

export default AssessmentBuilder;