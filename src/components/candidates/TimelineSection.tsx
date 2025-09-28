/**
 * Timeline Section Component
 * Displays candidate interaction timeline
 * 
 * Features:
 * - Chronological timeline of events
 * - Different event types with icons
 * - Expandable event details
 * - Professional timeline design
 */

import { Clock, User, FileText, Calendar, CheckCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import type { TimelineEntry } from '@/lib/database';

interface TimelineSectionProps {
  timeline: TimelineEntry[];
}

const TimelineSection = ({ timeline }: TimelineSectionProps) => {
  const getEventIcon = (type: TimelineEntry['type']) => {
    const icons = {
      stage_change: ArrowRight,
      note_added: FileText,
      assessment_completed: CheckCircle,
      interview_scheduled: Calendar,
    };
    
    const IconComponent = icons[type] || User;
    return <IconComponent className="h-4 w-4" />;
  };

  const getEventColor = (type: TimelineEntry['type']) => {
    const colors = {
      stage_change: 'bg-blue-100 text-blue-600 border-blue-200',
      note_added: 'bg-gray-100 text-gray-600 border-gray-200',
      assessment_completed: 'bg-green-100 text-green-600 border-green-200',
      interview_scheduled: 'bg-purple-100 text-purple-600 border-purple-200',
    };
    
    return colors[type] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const formatEventType = (type: TimelineEntry['type']) => {
    const labels = {
      stage_change: 'Stage Change',
      note_added: 'Note Added',
      assessment_completed: 'Assessment',
      interview_scheduled: 'Interview',
    };
    
    return labels[type] || 'Event';
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  if (timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No timeline events yet</p>
            <p className="text-xs">Events will appear here as they happen</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Timeline</span>
          <Badge variant="secondary">{timeline.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((event, index) => (
            <div key={event.id} className="flex space-x-4">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full border-2 ${getEventColor(event.type)}`}>
                  {getEventIcon(event.type)}
                </div>
                {index < timeline.length - 1 && (
                  <div className="w-px h-8 bg-border mt-2" />
                )}
              </div>

              {/* Event content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        {event.title}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {formatEventType(event.type)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {event.description}
                    </p>

                    {/* Event metadata */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                            </span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {formatRelativeTime(event.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline footer */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3" />
            <span>Timeline shows all candidate interactions</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelineSection;