import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./api-client/custom-fetch";

export interface MemberProfile {
  id: string;
  userId: string;
  teamId?: string | null;
  employmentStatus: string;
  internshipStartDate?: string | null;
  internshipEndDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

const memberProfilesKey = ["/api/member-profiles"] as const;

export function useListMemberProfiles() {
  return useQuery({
    queryKey: memberProfilesKey,
    queryFn: () => customFetch<MemberProfile[]>("/api/member-profiles", { method: "GET" }),
  });
}

export { memberProfilesKey };
