export type Chunk = {
  id: string;
  bucket_name: string;
  item_id: string;
  chunk_index: number;
  title?: string | null;
  chunk_text: string;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ChunkListResponse = {
  ok: boolean;
  count: number;
  chunks: Chunk[];
};

export type ChunkCreatePayload = {
  bucket_name: string;
  item_id: string;
  chunk_text: string;
  title?: string;
  chunk_index?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

export type ChunkUpdatePayload = Partial<{
  bucket_name: string;
  item_id: string;
  chunk_index: number;
  title: string | null;
  chunk_text: string;
  tags: string[];
  metadata: Record<string, unknown>;
}>;

export type ChunkCreateResponse = {
  ok: boolean;
  chunk_id: string;
};

export type DeleteChunkResponse = {
  ok: boolean;
  deleted_chunk_id: string;
};
