import { useQuery } from '@tanstack/react-query';

import { listChunks } from '@/api/chunks';
import { queryKeys } from '@/lib/queryKeys';

export function useBucketChunks(bucketName: string) {
  return useQuery({
    enabled: Boolean(bucketName),
    queryKey: queryKeys.chunks(bucketName),
    queryFn: () => listChunks(bucketName)
  });
}
