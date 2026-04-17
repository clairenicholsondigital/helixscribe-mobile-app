export const queryKeys = {
  buckets: ['knowledge-buckets'] as const,
  chunks: (bucketName: string) => ['knowledge-chunks', bucketName] as const,
  workflows: ['workflow-v2', 'list'] as const,
  workflow: (workflowId: string) => ['workflow-v2', workflowId] as const,
  workflowRuns: (workflowId: string) => ['workflow-v2', workflowId, 'runs'] as const,
  workflowRun: (runId: string) => ['workflow-v2-run', runId] as const
};
