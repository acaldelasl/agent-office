import type { WorkerHandle } from './types.js';

/** Change only the display name: process, session, branches and ownership stay the same. */
export function renameWorker(h: WorkerHandle, raw: unknown): string | undefined {
  if (typeof raw !== 'string' || /[\p{Cc}\p{Cf}]/u.test(raw)) return 'Use a plain display name';
  const name = raw.trim().normalize('NFC');
  if (!name || Array.from(name).length > 64) return 'Use a name of 1–64 characters';
  if (h.info.name === name) return;
  h.info.name = name;
  h.persist();
  h.emit();
}
