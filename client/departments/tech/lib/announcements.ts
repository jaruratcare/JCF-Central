import { useMutation, useQuery } from "@tanstack/react-query";
import { customFetch } from "./api-client/custom-fetch";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorMemberId?: string | null;
  audienceScope?: string | null;
  teamId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AnnouncementInput {
  title: string;
  body: string;
}

const announcementsKey = ["/api/announcements"] as const;

export function useListAnnouncements() {
  return useQuery({
    queryKey: announcementsKey,
    queryFn: () => customFetch<Announcement[]>("/api/announcements", { method: "GET" }),
  });
}

export function useCreateAnnouncement() {
  return useMutation({
    mutationFn: (data: AnnouncementInput) => customFetch<Announcement>("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  });
}

export function useUpdateAnnouncement() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AnnouncementInput }) => customFetch<Announcement>(`/api/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  });
}

export function useDeleteAnnouncement() {
  return useMutation({
    mutationFn: (id: string) => customFetch<void>(`/api/announcements/${id}`, { method: "DELETE" }),
  });
}

export { announcementsKey };
