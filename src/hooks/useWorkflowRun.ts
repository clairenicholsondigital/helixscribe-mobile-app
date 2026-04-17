import { useQuery } from '@tanstack/react-query';

import { getWorkflowRunV2 } from '@/api/workflowsV2';
import { queryKeys } from '@/lib/queryKeys';

export function useWorkflowRun(runId: string) {
  return useQuery({
    enabled: Boolean(runId),
    queryKey: queryKeys.workflowRun(runId),
    queryFn: () => getWorkflowRunV2(runId)
  });
}
