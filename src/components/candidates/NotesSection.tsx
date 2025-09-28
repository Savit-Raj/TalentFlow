/**
 * Notes Section Component
 * Handles candidate notes with @mention support
 * 
 * Features:
 * - Add new notes
 * - @mention suggestions (rendered only)
 * - Note history display
 * - Rich text formatting
 */

import { useState, useCallback, useMemo } from 'react';
import { Plus, MessageSquare, AtSign } from 'lucide-react';

import ButtonExports from '@/components/ui/button';
const { Button } = ButtonExports;
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';

interface NotesSectionProps {
  notes: string[];
  onAddNote: (note: string) => void;
}

// Mock team members for @mention suggestions
const TEAM_MEMBERS = [
  { id: '1', name: 'John Smith', email: 'john.smith@company.com', role: 'Hiring Manager' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'Technical Lead' },
  { id: '3', name: 'Mike Chen', email: 'mike.chen@company.com', role: 'HR Specialist' },
  { id: '4', name: 'Emily Davis', email: 'emily.davis@company.com', role: 'Senior Developer' },
  { id: '5', name: 'Alex Rodriguez', email: 'alex.rodriguez@company.com', role: 'Product Manager' },
];

const NotesSection = ({ notes, onAddNote }: NotesSectionProps) => {
  const [newNote, setNewNote] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  // Filter team members based on mention query
  const filteredMembers = useMemo(() => {
    if (!mentionQuery) return TEAM_MEMBERS;
    return TEAM_MEMBERS.filter(member =>
      member.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  }, [mentionQuery]);

  // Handle textarea change and detect @mentions
  const handleNoteChange = useCallback((value: string) => {
    setNewNote(value);

    // Simple @mention detection
    const cursorPos = cursorPosition;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if there's no space after @ (still typing the mention)
      if (!textAfterAt.includes(' ') && textAfterAt.length <= 20) {
        setMentionQuery(textAfterAt);
        setShowMentions(true);
        return;
      }
    }
    
    setShowMentions(false);
    setMentionQuery('');
  }, [cursorPosition]);

  // Handle mention selection
  const handleMentionSelect = useCallback((member: typeof TEAM_MEMBERS[0]) => {
    const textBeforeCursor = newNote.slice(0, cursorPosition);
    const textAfterCursor = newNote.slice(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const beforeAt = newNote.slice(0, lastAtIndex);
      const mention = `@${member.name}`;
      const newText = beforeAt + mention + ' ' + textAfterCursor;
      
      setNewNote(newText);
      setShowMentions(false);
      setMentionQuery('');
    }
  }, [newNote, cursorPosition]);

  // Handle note submission
  const handleSubmit = useCallback(() => {
    if (!newNote.trim()) return;
    
    onAddNote(newNote.trim());
    setNewNote('');
    setShowMentions(false);
    setMentionQuery('');
  }, [newNote, onAddNote]);

  // Handle textarea cursor position
  const handleTextareaSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setCursorPosition(target.selectionStart);
  }, []);

  // Render note with @mentions highlighted
  const renderNoteWithMentions = useCallback((note: string) => {
    // Simple regex to find @mentions
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const parts = note.split(mentionRegex);
    
    return parts.map((part, index) => {
      // Check if this part is a mention (odd indices after split)
      if (index % 2 === 1) {
        return (
          <Badge key={index} variant="secondary" className="mx-1">
            @{part}
          </Badge>
        );
      }
      return part;
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Notes</span>
          <Badge variant="secondary">{notes.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Note */}
        <div className="space-y-3">
          <div className="relative">
            <Textarea
              placeholder="Add a note... Use @name to mention team members"
              value={newNote}
              onChange={(e) => handleNoteChange(e.target.value)}
              onSelect={handleTextareaSelect}
              className="min-h-[80px] resize-none"
              rows={3}
            />
            
            {/* @mention suggestions */}
            {showMentions && filteredMembers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                <div className="p-2 text-xs text-muted-foreground border-b">
                  <AtSign className="inline h-3 w-3 mr-1" />
                  Mention team member
                </div>
                {filteredMembers.map((member) => (
                  <button
                    key={member.id}
                    className="w-full text-left p-3 hover:bg-muted transition-colors"
                    onClick={() => handleMentionSelect(member)}
                  >
                    <div className="font-medium text-sm">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.role}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleSubmit} 
            disabled={!newNote.trim()}
            size="sm"
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Note
          </Button>
        </div>

        {/* Existing Notes */}
        {notes.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Previous Notes</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notes.map((note, index) => (
                <div
                  key={index}
                  className="p-3 bg-muted/50 rounded-md text-sm"
                >
                  <div className="text-foreground">
                    {renderNoteWithMentions(note)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Added {new Date().toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notes yet</p>
            <p className="text-xs">Add the first note about this candidate</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotesSection;