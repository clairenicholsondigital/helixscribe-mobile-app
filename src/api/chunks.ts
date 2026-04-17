import { api, jsonBody } from '@/api/client';
import type {
  ChunkCreatePayload,
  ChunkCreateResponse,
  ChunkListResponse,
  ChunkUpdatePayload,
  DeleteChunkResponse
} from '@/types/chunks';

export function listChunks(bucketName: string, limit = 200): Promise<ChunkListResponse> {
  return api<ChunkListResponse>(
    `/chunks/?bucket_name=${encodeURIComponent(bucketName)}&limit=${limit}`
  );
}

export function createChunk(payload: ChunkCreatePayload): Promise<ChunkCreateResponse> {
  return api<ChunkCreateResponse>('/chunks/', {
    method: 'POST',
    body: jsonBody(payload)
  });
}

export function updateChunk(chunkId: string, payload: ChunkUpdatePayload): Promise<{ ok: boolean }> {
  return api<{ ok: boolean }>(`/chunks/${encodeURIComponent(chunkId)}`, {
    method: 'PATCH',
    body: jsonBody(payload)
  });
}

export function deleteChunk(chunkId: string): Promise<DeleteChunkResponse> {
  return api<DeleteChunkResponse>(`/chunks/${encodeURIComponent(chunkId)}`, {
    method: 'DELETE'
  });
}
