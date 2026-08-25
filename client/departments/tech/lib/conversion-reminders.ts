import { useQuery } from "@tanstack/react-query";
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

export { conversionRemindersKey };
