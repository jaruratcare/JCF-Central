import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./api-client/custom-fetch";

export interface Team {
  id: string;
  name: string;
  departmentId: string;
  leadMemberId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const teamsKey = ["/api/teams"] as const;

export function useListTeams() {
  return useQuery({
    queryKey: teamsKey,
    queryFn: () => customFetch<Team[]>("/api/teams", { method: "GET" }),
  });
}

export { teamsKey };
