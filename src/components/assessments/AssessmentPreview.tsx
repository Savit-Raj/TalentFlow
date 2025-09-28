import { useState } from 'react';
import { Eye, FileText } from 'lucide-react';
import ButtonExports from '@/components/ui/button';
const { Button } = ButtonExports;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { Assessment, Question } from '@/lib/database';

interface AssessmentPreviewProps {
  assessment: Assessment;
}

const QuestionPreview = ({ question, value, onChange }: {
  question: Question;
  value: string | number | string[] | undefined;
  onChange: (value: string | number | string[]) => void;
}) => {
  const renderInput = () => {
    switch (question.type) {
      case 'single-choice':
        return (
          <RadioGroup value={String(value || '')} onValueChange={onChange}>
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'multi-choice': {
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, option]);
                    } else {
                      onChange(selectedValues.filter((v: string) => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      }

      case 'short-text':
        return (
          <Input
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your answer"
            maxLength={question.validation?.maxLength}
          />
        );

      case 'long-text':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your detailed answer"
            rows={4}
            maxLength={question.validation?.maxLength}
          />
        );

      case 'numeric':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
            placeholder="Enter a number"
            min={question.validation?.min}
            max={question.validation?.max}
          />
        );

      case 'file-upload':
        return (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload or drag and drop your file here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOC, DOCX up to 10MB
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const getValidationInfo = () => {
    const info = [];
    if (question.validation?.minLength) {
      info.push(`Min: ${question.validation.minLength} chars`);
    }
    if (question.validation?.maxLength) {
      info.push(`Max: ${question.validation.maxLength} chars`);
    }
    if (question.validation?.min !== undefined) {
      info.push(`Min: ${question.validation.min}`);
    }
    if (question.validation?.max !== undefined) {
      info.push(`Max: ${question.validation.max}`);
    }
    return info;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <Label className="text-base font-medium">{question.title}</Label>
            {question.required && (
              <Badge variant="destructive" className="text-xs">Required</Badge>
            )}
          </div>
          {question.description && (
            <p className="text-sm text-muted-foreground mb-2">{question.description}</p>
          )}
          {getValidationInfo().length > 0 && (
            <p className="text-xs text-muted-foreground mb-2">
              {getValidationInfo().join(', ')}
            </p>
          )}
        </div>
      </div>
      {renderInput()}
    </div>
  );
};

const AssessmentPreview = ({ assessment }: AssessmentPreviewProps) => {
  const [responses, setResponses] = useState<Record<string, string | number | string[]>>({});

  const handleResponseChange = (questionId: string, value: string | number | string[]) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    assessment.sections.forEach(section => {
      section.questions.forEach(question => {
        if (question.required && !responses[question.id]) {
          errors.push(`${question.title} is required`);
        }
        
        const value = responses[question.id];
        if (value && question.validation) {
          if (question.type === 'short-text' || question.type === 'long-text') {
            const text = String(value);
            if (question.validation.minLength && text.length < question.validation.minLength) {
              errors.push(`${question.title} must be at least ${question.validation.minLength} characters`);
            }
            if (question.validation.maxLength && text.length > question.validation.maxLength) {
              errors.push(`${question.title} must be no more than ${question.validation.maxLength} characters`);
            }
          }
          
          if (question.type === 'numeric') {
            const num = parseFloat(String(value));
            if (question.validation.min !== undefined && num < question.validation.min) {
              errors.push(`${question.title} must be at least ${question.validation.min}`);
            }
            if (question.validation.max !== undefined && num > question.validation.max) {
              errors.push(`${question.title} must be no more than ${question.validation.max}`);
            }
          }
        }
      });
    });
    
    return errors;
  };

  const handleSubmit = () => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }
    
    alert('Assessment submitted successfully! (This is just a preview)');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-primary" />
            <CardTitle>Assessment Preview</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{assessment.title}</h2>
            {assessment.description && (
              <p className="text-muted-foreground">{assessment.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              This is how candidates will see the assessment
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {assessment.sections.map((section, sectionIndex) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle className="text-lg">
              {sectionIndex + 1}. {section.title}
            </CardTitle>
            {section.description && (
              <p className="text-muted-foreground">{section.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {section.questions.map((question, questionIndex) => (
              <div key={question.id} className="pb-4 border-b border-border last:border-b-0 last:pb-0">
                <div className="mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Question {sectionIndex + 1}.{questionIndex + 1}
                  </span>
                </div>
                <QuestionPreview
                  question={question}
                  value={responses[question.id]}
                  onChange={(value) => handleResponseChange(question.id, value)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} size="lg">
          Submit Assessment (Preview)
        </Button>
      </div>
    </div>
  );
};

export default AssessmentPreview;