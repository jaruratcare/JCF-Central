import { useQuery } from "@tanstack/react-query";
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

export { milestonesKey };
