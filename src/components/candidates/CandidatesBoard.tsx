/**
 * Candidates Board Component
 * Main interface for managing candidates with advanced features
 * 
 * Features:
 * - Virtualized list of 1000+ candidates
 * - Client-side search (name/email)
 * - Server-like stage filtering
 * - Kanban board for stage management
 * - Candidate profile navigation
 * - Notes with @mention support
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, Users, LayoutGrid, List } from 'lucide-react';

import ButtonExports from '@/components/ui/button';
const { Button } = ButtonExports;
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

import CandidateCard from '@/components/candidates/CandidateCard';
import CandidatesKanban from './CandidatesKanban';
import { CandidatesApi } from '@/lib/api';
import type { Candidate } from '@/lib/database';


const CandidatesBoard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State management
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // URL-based filters
  const search = searchParams.get('search') || '';
  const stage = searchParams.get('stage') || '';

  // Update URL params helper
  const updateSearchParams = useCallback((updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Fetch candidates with pagination
  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await CandidatesApi.getCandidates({
        pageSize: 1000, // Get all for filtering
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      setCandidates(result.data.data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load candidates. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Client-side filtering
  useEffect(() => {
    const validStages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];
    let filtered = candidates.filter(candidate => validStages.includes(candidate.stage));

    // Apply search filter (name or email)
    if (search) {
      filtered = filtered.filter(candidate => 
        candidate.name.toLowerCase().includes(search.toLowerCase()) ||
        candidate.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply stage filter
    if (stage) {
      filtered = filtered.filter(candidate => candidate.stage === stage);
    }

    setFilteredCandidates(filtered);
  }, [candidates, search, stage]);

  // Load candidates on mount
  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Handle search input
  const handleSearchChange = useCallback((value: string) => {
    updateSearchParams({ search: value });
    setCurrentPage(1);
  }, [updateSearchParams]);

  // Handle stage filter change
  const handleStageChange = useCallback((value: string) => {
    updateSearchParams({ stage: value === 'all' ? null : value });
    setCurrentPage(1);
  }, [updateSearchParams]);

  // Handle candidate stage update
  const handleStageUpdate = useCallback(async (candidateId: string, newStage: Candidate['stage']) => {
    try {
      const result = await CandidatesApi.updateCandidate(candidateId, { stage: newStage });
      if (result.error) throw new Error(result.error.message);

      // Update local state
      setCandidates(prev => prev.map(candidate => 
        candidate.id === candidateId 
          ? { ...candidate, stage: newStage, updatedAt: new Date() }
          : candidate
      ));

      toast({
        title: 'Stage Updated',
        description: 'Candidate stage has been updated successfully.',
      });
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update candidate stage.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Handle candidate profile navigation
  const handleCandidateClick = useCallback((candidate: Candidate) => {
    navigate(`/candidates/${encodeURIComponent(candidate.email)}`);
  }, [navigate]);



  // Memoized stage counts for filter badges
  const stageCounts = useMemo(() => {
    const validStages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];
    const counts = candidates
      .filter(candidate => validStages.includes(candidate.stage))
      .reduce((acc, candidate) => {
        acc[candidate.stage] = (acc[candidate.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    return counts;
  }, [candidates]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Candidates</h1>
            <p className="text-muted-foreground">
              {filteredCandidates.length} of {candidates.length} candidates
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="flex-1 sm:flex-none"
          >
            <List className="mr-1 sm:mr-2 h-4 w-4" />
            <span className=" xs:inline">List</span>
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="flex-1 sm:flex-none"
          >
            <LayoutGrid className="mr-1 sm:mr-2 h-4 w-4" />
            <span className=" xs:inline">Kanban</span>
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Stage Filter */}
            <Select value={stage || 'all'} onValueChange={handleStageChange}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages ({candidates.length})</SelectItem>
                <SelectItem value="applied">Applied ({stageCounts.applied || 0})</SelectItem>
                <SelectItem value="screen">Screening ({stageCounts.screen || 0})</SelectItem>
                <SelectItem value="tech">Technical ({stageCounts.tech || 0})</SelectItem>
                <SelectItem value="offer">Offer ({stageCounts.offer || 0})</SelectItem>
                <SelectItem value="hired">Hired ({stageCounts.hired || 0})</SelectItem>
                <SelectItem value="rejected">Rejected ({stageCounts.rejected || 0})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
              <p className="text-muted-foreground">
                {search || stage ? 'Try adjusting your filters' : 'No candidates available'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'kanban' ? (
        <CandidatesKanban
          candidates={filteredCandidates}
          onStageUpdate={handleStageUpdate}
          onCandidateClick={handleCandidateClick}
        />
      ) : (
        <div className="space-y-4">
          <div className="space-y-4">
            {filteredCandidates
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onStageUpdate={handleStageUpdate}
                  onClick={() => handleCandidateClick(candidate)}
                />
              ))}
          </div>
          
          {/* Pagination */}
          {filteredCandidates.length > pageSize && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredCandidates.length)} of{' '}
                {filteredCandidates.length} candidates
              </p>
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm whitespace-nowrap">
                  Page {currentPage} of {Math.ceil(filteredCandidates.length / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage * pageSize >= filteredCandidates.length}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CandidatesBoard;