export type CoreTopicSummary = {
  core_topic_id: string;
  bucket_id: string;
  core_topic_slug?: string | null;
  core_topic_name: string;
  summary?: string;
  position?: number;
};

export type KnowledgeBucket = {
  bucket_id: string;
  bucket_slug?: string | null;
  bucket_name: string;
  summary: string;
  routing_keywords: string;
  item_count: number;
  chunk_count: number;
  topic_count: number;
  updated_at?: string | null;
  topics?: CoreTopicSummary[];
};

export type KnowledgeBucketListResponse = {
  ok: boolean;
  count: number;
  items: KnowledgeBucket[];
  compatibility_mode?: boolean;
  note?: string;
};
