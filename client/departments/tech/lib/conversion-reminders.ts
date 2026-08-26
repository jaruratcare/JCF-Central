import { useMutation, useQuery } from "@tanstack/react-query";
import { customFetch } from "./api-client/custom-fetch";

export interface ConversionReminder {
  id: string;
  memberId: string;
  reminderType: string;
  dueDate: string;
  recipientMemberId?: string | null;
  sentAt?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const conversionRemindersKey = ["/api/conversion-reminders"] as const;

export function useListConversionReminders() {
  return useQuery({
    queryKey: conversionRemindersKey,
    queryFn: () => customFetch<ConversionReminder[]>("/api/conversion-reminders", { method: "GET" }),
  });
}

export function useCreateConversionReminder() { return useMutation({ mutationFn: (data: Partial<ConversionReminder>) => customFetch<ConversionReminder>("/api/conversion-reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }) }); }
export function useUpdateConversionReminder() { return useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<ConversionReminder> }) => customFetch<ConversionReminder>(`/api/conversion-reminders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }) }); }
export function useDeleteConversionReminder() { return useMutation({ mutationFn: (id: string) => customFetch<void>(`/api/conversion-reminders/${id}`, { method: "DELETE" }) }); }

export { conversionRemindersKey };
