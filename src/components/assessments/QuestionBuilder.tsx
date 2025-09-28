import { useState } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import ButtonExports from '@/components/ui/button';
const { Button } = ButtonExports;
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Question } from '@/lib/database';

interface QuestionBuilderProps {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
}

const QuestionBuilder = ({ question, onUpdate, onDelete }: QuestionBuilderProps) => {
  const [options, setOptions] = useState<string[]>(question.options || []);

  const updateOptions = (newOptions: string[]) => {
    setOptions(newOptions);
    onUpdate({ options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...options, ''];
    updateOptions(newOptions);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    updateOptions(newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    updateOptions(newOptions);
  };

  const needsOptions = question.type === 'single-choice' || question.type === 'multi-choice';

  return (
    <Card className="border-l-4 border-l-primary/20">
      <CardContent className="p-4 space-y-4">
        {/* Question Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <Select
                value={question.type}
                onValueChange={(value) => onUpdate({ type: value as Question['type'] })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single-choice">Single Choice</SelectItem>
                  <SelectItem value="multi-choice">Multiple Choice</SelectItem>
                  <SelectItem value="short-text">Short Text</SelectItem>
                  <SelectItem value="long-text">Long Text</SelectItem>
                  <SelectItem value="numeric">Numeric</SelectItem>
                  <SelectItem value="file-upload">File Upload</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`required-${question.id}`}
                  checked={question.required}
                  onCheckedChange={(checked) => onUpdate({ required: checked as boolean })}
                />
                <Label htmlFor={`required-${question.id}`} className="text-sm">Required</Label>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Question Title */}
        <div>
          <Label>Question</Label>
          <Input
            value={question.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Enter your question"
          />
        </div>

        {/* Question Description */}
        <div>
          <Label>Description (optional)</Label>
          <Textarea
            value={question.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Additional context or instructions"
            rows={2}
          />
        </div>

        {/* Options for Choice Questions */}
        {needsOptions && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Options</Label>
              <Button variant="outline" size="sm" onClick={addOption}>
                <Plus className="mr-1 h-3 w-3" />
                Add Option
              </Button>
            </div>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {options.length === 0 && (
                <p className="text-sm text-muted-foreground">No options added yet</p>
              )}
            </div>
          </div>
        )}

        {/* Validation Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(question.type === 'short-text' || question.type === 'long-text') && (
            <>
              <div>
                <Label>Min Length</Label>
                <Input
                  type="number"
                  value={question.validation?.minLength || ''}
                  onChange={(e) => onUpdate({
                    validation: {
                      ...question.validation,
                      minLength: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  })}
                  placeholder="Minimum characters"
                />
              </div>
              <div>
                <Label>Max Length</Label>
                <Input
                  type="number"
                  value={question.validation?.maxLength || ''}
                  onChange={(e) => onUpdate({
                    validation: {
                      ...question.validation,
                      maxLength: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  })}
                  placeholder="Maximum characters"
                />
              </div>
            </>
          )}

          {question.type === 'numeric' && (
            <>
              <div>
                <Label>Min Value</Label>
                <Input
                  type="number"
                  value={question.validation?.min || ''}
                  onChange={(e) => onUpdate({
                    validation: {
                      ...question.validation,
                      min: e.target.value ? parseFloat(e.target.value) : undefined
                    }
                  })}
                  placeholder="Minimum value"
                />
              </div>
              <div>
                <Label>Max Value</Label>
                <Input
                  type="number"
                  value={question.validation?.max || ''}
                  onChange={(e) => onUpdate({
                    validation: {
                      ...question.validation,
                      max: e.target.value ? parseFloat(e.target.value) : undefined
                    }
                  })}
                  placeholder="Maximum value"
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionBuilder;