import { api } from '@/api/client';
import type { KnowledgeBucketListResponse } from '@/types/buckets';

export function listKnowledgeBuckets(includeCoreTopics = false): Promise<KnowledgeBucketListResponse> {
  return api<KnowledgeBucketListResponse>(
    `/knowledge-buckets?include_core_topics=${includeCoreTopics ? 'true' : 'false'}`
  );
}
