import { useQuery } from '@tanstack/react-query';

import { getWorkflowV2 } from '@/api/workflowsV2';
import { queryKeys } from '@/lib/queryKeys';

export function useWorkflowV2(workflowId: string) {
  return useQuery({
    enabled: Boolean(workflowId),
    queryKey: queryKeys.workflow(workflowId),
    queryFn: () => getWorkflowV2(workflowId)
  });
}
