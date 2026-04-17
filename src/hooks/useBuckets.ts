import { useQuery } from '@tanstack/react-query';

import { listKnowledgeBuckets } from '@/api/buckets';
import { queryKeys } from '@/lib/queryKeys';

export function useBuckets() {
  return useQuery({
    queryKey: queryKeys.buckets,
    queryFn: () => listKnowledgeBuckets(false)
  });
}
