import { useState, useEffect } from 'react';
import { JobsApi } from '@/lib/api';

export const useCandidateCount = (jobId: string) => {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const result = await JobsApi.getCandidateCount(jobId);
        if (result.data) {
          setCount(result.data.count);
        }
      } catch (error) {
        console.error('Failed to fetch candidate count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
  }, [jobId]);

  return { count, isLoading };
};