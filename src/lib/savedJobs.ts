const STORAGE_KEY = 'sja_saved';
const MAX_SAVED = 200;

export function getSavedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as string[];
    return [];
  } catch {
    return [];
  }
}

export function toggleSave(id: string): void {
  const ids = getSavedIds();
  const index = ids.indexOf(id);
  if (index >= 0) {
    ids.splice(index, 1);
  } else {
    if (ids.length >= MAX_SAVED) {
      ids.pop();
    }
    ids.unshift(id);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event('storage'));
}
