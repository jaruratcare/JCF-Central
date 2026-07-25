import { describe, expect, it } from 'vitest';
import { normalizeProjectStatus, normalizeItemFormPayload } from './normalizers';

describe('normalizeProjectStatus', () => {
  it('maps legacy sign_off values to signed_off', () => {
    expect(normalizeProjectStatus('sign_off')).toBe('signed_off');
  });

  it('keeps supported statuses intact', () => {
    expect(normalizeProjectStatus('planning')).toBe('planning');
    expect(normalizeProjectStatus('active')).toBe('active');
    expect(normalizeProjectStatus('hold')).toBe('hold');
    expect(normalizeProjectStatus('signed_off')).toBe('signed_off');
  });
});

describe('normalizeItemFormPayload', () => {
  it('preserves explicit null parent values so parent links can be cleared', () => {
    const payload = normalizeItemFormPayload({
      parentItemId: null,
      sprintId: null,
      epicId: null,
    });

    expect(payload.parentItemId).toBeNull();
    expect(payload.sprintId).toBeNull();
    expect(payload.epicId).toBeNull();
  });
});
