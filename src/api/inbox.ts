import { api, jsonBody } from '@/api/client';
import type {
  InboxUntriagedCreatePayload,
  InboxUntriagedCreateResponse
} from '@/types/inbox';

export function createInboxUntriagedChunk(
  payload: InboxUntriagedCreatePayload
): Promise<InboxUntriagedCreateResponse> {
  return api<InboxUntriagedCreateResponse>('/inbox-untriaged/', {
    method: 'POST',
    body: jsonBody(payload)
  });
}
