import { useQuery } from '@tanstack/react-query';

import { listWorkflowRunsV2 } from '@/api/workflowsV2';
import { queryKeys } from '@/lib/queryKeys';

export function useWorkflowRuns(workflowId: string, limit = 20) {
  return useQuery({
    enabled: Boolean(workflowId),
    queryKey: [...queryKeys.workflowRuns(workflowId), limit],
    queryFn: () => listWorkflowRunsV2(workflowId, limit)
  });
}
