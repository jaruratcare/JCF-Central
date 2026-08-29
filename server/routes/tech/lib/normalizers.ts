export function normalizeProjectStatus(status: string | undefined | null): string | undefined {
  if (!status) return undefined;
  if (status === 'signed_off') return 'sign_off';
  return status;
}

export function normalizeItemFormPayload(payload: Record<string, unknown>) {
  const normalized: Record<string, unknown> = { ...payload };

  for (const key of ['parentItemId', 'sprintId', 'epicId']) {
    if (key in normalized && normalized[key] === undefined) {
      delete normalized[key];
    }
  }

  return normalized;
}
