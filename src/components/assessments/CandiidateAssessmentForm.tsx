import { useState, useCallback, useEffect } from 'react';
import { FileText, AlertCircle, Timer } from 'lucide-react';
import ButtonExports from '@/components/ui/button';
const { Button } = ButtonExports;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { Assessment, Question } from '@/lib/database';

interface CandidateAssessmentFormProps {
  assessment: Assessment;
  candidateId: string;
  onSubmit: (responses: Record<string, string | number | string[]>) => Promise<void>;
  initialResponses?: Record<string, string | number | string[]>;
  isSubmitting?: boolean;
  timeLimit?: number; // in minutes
}

const QuestionRenderer = ({ 
  question, 
  value, 
  onChange, 
  error 
}: {
  question: Question;
  value: string | number | string[] | undefined;
  onChange: (value: string | number | string[]) => void;
  error?: string;
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
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your answer"
            maxLength={question.validation?.maxLength}
            className={error ? 'border-destructive' : ''}
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
            className={error ? 'border-destructive' : ''}
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
            className={error ? 'border-destructive' : ''}
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
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onChange(file.name); // In a real app, you'd upload the file
                }
              }}
              className="hidden"
              id={`file-${question.id}`}
            />
            <Label htmlFor={`file-${question.id}`} className="cursor-pointer">
              <Button variant="outline" className="mt-2" asChild>
                <span>Choose File</span>
              </Button>
            </Label>
            {value && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {value}
              </p>
            )}
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
      {error && (
        <div className="flex items-center space-x-1 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

const CandidateAssessmentForm = ({ 
  assessment, 
  onSubmit, 
  initialResponses = {},
  isSubmitting = false,
  timeLimit = 2 // default 2 minutes
}: Omit<CandidateAssessmentFormProps, 'candidateId'>) => {
  const { toast } = useToast();
  const [responses, setResponses] = useState<Record<string, string | number | string[]>>(initialResponses);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60); // convert to seconds
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      setIsTimeUp(true);
      toast({
        title: 'Time Up!',
        description: 'The assessment time has expired. Please submit your current progress.',
        variant: 'destructive',
      });
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResponseChange = useCallback((questionId: string, value: string | number | string[]) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  }, [errors]);

  const validateSection = (sectionIndex: number) => {
    const section = assessment.sections[sectionIndex];
    const sectionErrors: Record<string, string> = {};
    
    section.questions.forEach(question => {
      const value = responses[question.id];
      
      // Check required fields
      if (question.required && (!value || (Array.isArray(value) && value.length === 0))) {
        sectionErrors[question.id] = 'This field is required';
        return;
      }
      
      // Validate based on question type
      if (value && question.validation) {
        if (question.type === 'short-text' || question.type === 'long-text') {
          const text = String(value);
          if (question.validation.minLength && text.length < question.validation.minLength) {
            sectionErrors[question.id] = `Must be at least ${question.validation.minLength} characters`;
          }
          if (question.validation.maxLength && text.length > question.validation.maxLength) {
            sectionErrors[question.id] = `Must be no more than ${question.validation.maxLength} characters`;
          }
        }
        
        if (question.type === 'numeric') {
          const num = parseFloat(String(value));
          if (isNaN(num)) {
            sectionErrors[question.id] = 'Must be a valid number';
          } else {
            if (question.validation.min !== undefined && num < question.validation.min) {
              sectionErrors[question.id] = `Must be at least ${question.validation.min}`;
            }
            if (question.validation.max !== undefined && num > question.validation.max) {
              sectionErrors[question.id] = `Must be no more than ${question.validation.max}`;
            }
          }
        }
      }
    });
    
    return sectionErrors;
  };

  const handleNextSection = () => {
    const sectionErrors = validateSection(currentSection);
    if (Object.keys(sectionErrors).length > 0) {
      setErrors(sectionErrors);
      toast({
        title: 'Please fix the errors',
        description: 'Some required fields are missing or invalid',
        variant: 'destructive',
      });
      return;
    }
    
    setCurrentSection(prev => Math.min(prev + 1, assessment.sections.length - 1));
  };

  const handlePrevSection = () => {
    setCurrentSection(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    // Validate all sections
    let allErrors: Record<string, string> = {};
    for (let i = 0; i < assessment.sections.length; i++) {
      const sectionErrors = validateSection(i);
      allErrors = { ...allErrors, ...sectionErrors };
    }
    
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      toast({
        title: 'Please fix all errors',
        description: 'Some required fields are missing or invalid',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await onSubmit(responses);
      toast({
        title: 'Assessment Submitted',
        description: 'Your assessment has been submitted successfully',
      });
    } catch {
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit assessment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const currentSectionData = assessment.sections[currentSection];
  const isLastSection = currentSection === assessment.sections.length - 1;
  const isFirstSection = currentSection === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Timer */}
      <Card className={`border-2 ${isTimeUp ? 'border-red-500 bg-red-50' : timeRemaining <= 60 ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-3">
            <Timer className={`h-6 w-6 ${isTimeUp ? 'text-red-600' : timeRemaining <= 60 ? 'text-orange-600' : 'text-blue-600'}`} />
            <div className="text-center">
              <div className={`text-2xl font-bold ${isTimeUp ? 'text-red-600' : timeRemaining <= 60 ? 'text-orange-600' : 'text-blue-600'}`}>
                {formatTime(timeRemaining)}
              </div>
              <p className={`text-sm ${isTimeUp ? 'text-red-700' : timeRemaining <= 60 ? 'text-orange-700' : 'text-blue-700'}`}>
                {isTimeUp ? 'Time expired!' : 'Time remaining'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{assessment.title}</CardTitle>
          {assessment.description && (
            <p className="text-muted-foreground">{assessment.description}</p>
          )}
        </CardHeader>
        <CardContent>
          {/* Progress */}
          <div className="flex items-center space-x-2 mb-4">
            {assessment.sections.map((_, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index === currentSection 
                    ? 'bg-primary text-primary-foreground' 
                    : index < currentSection 
                    ? 'bg-green-500 text-white' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                {index < assessment.sections.length - 1 && (
                  <div className={`w-8 h-0.5 ${
                    index < currentSection ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Section {currentSection + 1} of {assessment.sections.length}
          </p>
        </CardContent>
      </Card>

      {/* Current Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {currentSection + 1}. {currentSectionData.title}
          </CardTitle>
          {currentSectionData.description && (
            <p className="text-muted-foreground">{currentSectionData.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {currentSectionData.questions.map((question, questionIndex) => (
            <div key={question.id} className="pb-4 border-b border-border last:border-b-0 last:pb-0">
              <div className="mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Question {currentSection + 1}.{questionIndex + 1}
                </span>
              </div>
              <QuestionRenderer
                question={question}
                value={responses[question.id]}
                onChange={(value) => handleResponseChange(question.id, value)}
                error={errors[question.id]}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevSection}
          disabled={isFirstSection}
        >
          Previous
        </Button>
        
        {isLastSection ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="lg"
            variant={isTimeUp ? 'destructive' : 'default'}
          >
            {isTimeUp ? 'Submit Now (Time Up)' : 'Submit Assessment'}
          </Button>
        ) : (
          <Button onClick={handleNextSection} disabled={isTimeUp}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
};

export default CandidateAssessmentForm;