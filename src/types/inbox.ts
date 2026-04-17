export type InboxUntriagedCreatePayload = {
  chunk_text: string;
  title?: string;
  item_id?: string;
  chunk_index?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

export type InboxUntriagedCreateResponse = {
  ok: boolean;
  bucket_name: string;
  chunk_id: string;
  item_id: string;
};
