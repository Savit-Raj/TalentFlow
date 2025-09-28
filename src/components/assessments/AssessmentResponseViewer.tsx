import { FileText, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Assessment, CandidateResponse, Question } from '@/lib/database';

interface AssessmentResponseViewerProps {
  assessment: Assessment;
  response: CandidateResponse;
}

const ResponseDisplay = ({ question, answer }: { question: Question; answer: string | number | boolean | string[] | undefined }) => {
  const renderAnswer = () => {
    if (!answer) return <span className="text-muted-foreground">No answer provided</span>;

    switch (question.type) {
      case 'single-choice':
        return <span className="font-medium">{answer}</span>;
      
      case 'multi-choice':
        if (Array.isArray(answer)) {
          return (
            <div className="flex flex-wrap gap-1">
              {answer.map((item, index) => (
                <Badge key={index} variant="outline">{item}</Badge>
              ))}
            </div>
          );
        }
        return <span className="font-medium">{answer}</span>;
      
      case 'short-text':
        return <span className="font-medium">{answer}</span>;
      
      case 'long-text':
        return (
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="whitespace-pre-wrap">{answer}</p>
          </div>
        );
      
      case 'numeric':
        return <span className="font-medium font-mono">{answer}</span>;
      
      case 'file-upload':
        return (
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span className="font-medium">{answer}</span>
          </div>
        );
      
      default:
        return <span className="font-medium">{String(answer)}</span>;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium">{question.title}</h4>
          {question.description && (
            <p className="text-sm text-muted-foreground">{question.description}</p>
          )}
        </div>
        {question.required && (
          <Badge variant="outline" className="text-xs">Required</Badge>
        )}
      </div>
      <div className="pl-4 border-l-2 border-muted">
        {renderAnswer()}
      </div>
    </div>
  );
};

const AssessmentResponseViewer = ({ assessment, response }: AssessmentResponseViewerProps) => {
  const totalQuestions = assessment.sections.reduce((sum, section) => sum + section.questions.length, 0);
  const answeredQuestions = Object.keys(response.responses).length;
  const completionPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  const getStatusBadge = () => {
    switch (response.status) {
      case 'draft':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Draft</Badge>;
      case 'submitted':
        return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Submitted</Badge>;
      case 'reviewed':
        return <Badge variant="outline"><CheckCircle className="mr-1 h-3 w-3" />Reviewed</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{assessment.title} - Response</CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Completion Progress</span>
                <span className="text-sm text-muted-foreground">
                  {answeredQuestions} of {totalQuestions} questions
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Submitted:</span>
                <span className="ml-2 font-medium">
                  {response.submittedAt.toLocaleDateString()} at {response.submittedAt.toLocaleTimeString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className="ml-2 font-medium capitalize">{response.status}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections and Responses */}
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
                <ResponseDisplay
                  question={question}
                  answer={response.responses[question.id]}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AssessmentResponseViewer;