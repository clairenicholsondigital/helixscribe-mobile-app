import { useQuery } from '@tanstack/react-query';

import { listWorkflowsV2 } from '@/api/workflowsV2';
import { queryKeys } from '@/lib/queryKeys';

export function useWorkflowsV2(limit = 50) {
  return useQuery({
    queryKey: [...queryKeys.workflows, limit],
    queryFn: () => listWorkflowsV2(limit)
  });
}
