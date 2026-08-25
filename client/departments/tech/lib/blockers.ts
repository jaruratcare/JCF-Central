import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./api-client/custom-fetch";

export interface Blocker {
  id: string;
  referenceCode: string;
  projectId: number;
  teamId?: string | null;
  severity: string;
  description: string;
  status: string;
  raisedAt: string;
  raisedBy: string;
  ownerMemberId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlockerComment {
  id: string;
  blockerId: string;
  authorMemberId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

const blockersKey = ["/api/blockers"] as const;
const blockerCommentsKey = (blockerId: string) => ["/api/blockers", blockerId, "comments"] as const;

export function useListBlockers() {
  return useQuery({
    queryKey: blockersKey,
    queryFn: () => customFetch<Blocker[]>("/api/blockers", { method: "GET" }),
  });
}

export function useListBlockerComments(blockerId: string | undefined) {
  return useQuery({
    queryKey: blockerCommentsKey(blockerId ?? ""),
    queryFn: () => customFetch<BlockerComment[]>(`/api/blockers/${blockerId}/comments`, { method: "GET" }),
    enabled: Boolean(blockerId),
  });
}

export { blockersKey, blockerCommentsKey };
