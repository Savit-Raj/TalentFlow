/**
 * Job Modal Component
 * Modal form for creating and editing job postings
 * 
 * Features:
 * - Comprehensive job form with validation
 * - Support for all job fields (title, description, requirements, etc.)
 * - Tag management with add/remove functionality
 * - Salary range inputs
 * - Real-time validation feedback
 * - Professional form styling
 */

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import ButtonExports from '@/components/ui/button';
const { Button } = ButtonExports;
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { Job } from '@/lib/database';

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (jobData: Partial<Job>) => Promise<void>;
  job?: Job | null;
}

interface FormData {
  title: string;
  description: string;
  location: string;
  type: Job['type'];
  status: Job['status'];
  tags: string[];
  requirements: string[];
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  location: '',
  type: 'full-time',
  status: 'active',
  tags: [],
  requirements: [],
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: 'USD',
};

const JobModal = ({ isOpen, onClose, onSave, job }: JobModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [newTag, setNewTag] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load job data when editing or reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (job) {
        setFormData({
          title: job.title,
          description: job.description,
          location: job.location || '',
          type: job.type || 'full-time',
          status: job.status,
          tags: [...job.tags],
          requirements: [...(job.requirements || [])],
          salaryMin: job.salary?.min.toString() || '',
          salaryMax: job.salary?.max.toString() || '',
          salaryCurrency: job.salary?.currency || 'USD',
        });
      } else {
        setFormData(initialFormData);
      }
    } else {
      setFormData(initialFormData);
      setNewTag('');
      setNewRequirement('');
      setErrors({});
    }
  }, [isOpen, job]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Job title must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required';
    }

    if (formData.salaryMin && formData.salaryMax) {
      const min = parseInt(formData.salaryMin);
      const max = parseInt(formData.salaryMax);
      
      if (isNaN(min) || min < 0) {
        newErrors.salaryMin = 'Invalid minimum salary';
      }
      
      if (isNaN(max) || max < 0) {
        newErrors.salaryMax = 'Invalid maximum salary';
      }
      
      if (!isNaN(min) && !isNaN(max) && min >= max) {
        newErrors.salaryMax = 'Maximum salary must be greater than minimum';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const jobData: Partial<Job> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim() || undefined,
        type: formData.type,
        status: formData.status,
        tags: formData.tags,
        requirements: formData.requirements.filter(req => req.trim()),
      };

      // Add salary if provided
      if (formData.salaryMin && formData.salaryMax) {
        jobData.salary = {
          min: parseInt(formData.salaryMin),
          max: parseInt(formData.salaryMax),
          currency: formData.salaryCurrency,
        };
      }

      await onSave(jobData);
    } catch {
      // Error handling is done in parent component
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle tag management
  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  // Handle requirement management
  const handleAddRequirement = () => {
    const requirement = newRequirement.trim();
    if (requirement && !formData.requirements.includes(requirement)) {
      setFormData(prev => ({ ...prev, requirements: [...prev.requirements, requirement] }));
    }
    setNewRequirement('');
  };

  const handleRemoveRequirement = (reqToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(req => req !== reqToRemove),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {job ? 'Edit Job' : 'Create New Job'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {job ? 'Update job information and requirements' : 'Fill in the details to create a new job posting'}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="form-section">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {job && (
                <div>
                  <Label htmlFor="jobNumber">Job ID</Label>
                  <Input
                    id="jobNumber"
                    value={`#${job.jobNumber}`}
                    readOnly
                    className="bg-muted font-mono"
                  />
                </div>
              )}
              
              <div className={job ? '' : 'md:col-span-2'}>
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Senior Frontend Developer"
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., San Francisco, CA or Remote"
                />
              </div>

              <div>
                <Label htmlFor="type">Job Type</Label>
                <Select value={formData.type} 
                onValueChange={(value) => value && handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => value && handleInputChange('status', value as Job['status'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                rows={4}
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Salary Information */}
          <div className="form-section">
            <h3 className="text-lg font-semibold mb-4">Salary Range</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="salaryMin">Minimum Salary</Label>
                <Input
                  id="salaryMin"
                  type="number"
                  value={formData.salaryMin}
                  onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                  placeholder="80000"
                  className={errors.salaryMin ? 'border-destructive' : ''}
                />
                {errors.salaryMin && (
                  <p className="text-sm text-destructive mt-1">{errors.salaryMin}</p>
                )}
              </div>

              <div>
                <Label htmlFor="salaryMax">Maximum Salary</Label>
                <Input
                  id="salaryMax"
                  type="number"
                  value={formData.salaryMax}
                  onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                  placeholder="120000"
                  className={errors.salaryMax ? 'border-destructive' : ''}
                />
                {errors.salaryMax && (
                  <p className="text-sm text-destructive mt-1">{errors.salaryMax}</p>
                )}
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.salaryCurrency} onValueChange={(value) => { if (value) handleInputChange('salaryCurrency', value); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="form-section">
            <h3 className="text-lg font-semibold mb-4">Skills & Technologies</h3>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a skill or technology"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Requirements */}
          <div className="form-section">
            <h3 className="text-lg font-semibold mb-4">Requirements</h3>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Add a job requirement"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
                />
                <Button type="button" onClick={handleAddRequirement} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.requirements.length > 0 && (
                <div className="space-y-2">
                  {formData.requirements.map((requirement, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <span className="flex-1 text-sm">{requirement}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRequirement(requirement)}
                        className="h-6 w-6 p-0 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : job ? 'Update Job' : 'Create Job'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JobModal;