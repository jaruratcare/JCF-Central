import { useMutation, useQuery } from "@tanstack/react-query";
import { customFetch } from "./api-client/custom-fetch";

export interface Milestone {
  id: string;
  projectId: number;
  title: string;
  description?: string | null;
  milestoneDate: string;
  status?: string | null;
  ownerMemberId?: string | null;
  createdAt: string;
  updatedAt: string;
}

const milestonesKey = ["/api/milestones"] as const;

export function useListMilestones() {
  return useQuery({
    queryKey: milestonesKey,
    queryFn: () => customFetch<Milestone[]>("/api/milestones", { method: "GET" }),
  });
}

export function useCreateMilestone() { return useMutation({ mutationFn: (data: Partial<Milestone>) => customFetch<Milestone>("/api/milestones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }) }); }
export function useUpdateMilestone() { return useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<Milestone> }) => customFetch<Milestone>(`/api/milestones/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }) }); }
export function useDeleteMilestone() { return useMutation({ mutationFn: (id: string) => customFetch<void>(`/api/milestones/${id}`, { method: "DELETE" }) }); }

export { milestonesKey };
