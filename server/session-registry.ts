export interface SessionRegistryOptions {
  maxEntries?: number;
  ttlMs?: number;
  now?: () => number;
}

interface SessionEntry<T> {
  value: T;
  touchedAt: number;
}

/**
 * A deliberately small in-process LRU/TTL registry for the public assessment demo.
 * It prevents anonymous visitors from sharing canonical state without pretending to
 * be a durable multi-node database. The deployment contract keeps one process alive.
 */
export class SessionRegistry<T> {
  private readonly entries = new Map<string, SessionEntry<T>>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(
    private readonly createValue: () => T,
    options: SessionRegistryOptions = {},
  ) {
    this.maxEntries = options.maxEntries ?? 256;
    this.ttlMs = options.ttlMs ?? 30 * 60 * 1_000;
    this.now = options.now ?? Date.now;

    if (!Number.isSafeInteger(this.maxEntries) || this.maxEntries < 1) {
      throw new Error('maxEntries must be a positive integer');
    }
    if (!Number.isFinite(this.ttlMs) || this.ttlMs < 1) {
      throw new Error('ttlMs must be positive');
    }
  }

  get(id: string): T {
    const now = this.now();
    this.prune(now);

    const existing = this.entries.get(id);
    if (existing) {
      this.entries.delete(id);
      this.entries.set(id, { value: existing.value, touchedAt: now });
      return existing.value;
    }

    while (this.entries.size >= this.maxEntries) {
      const oldestId = this.entries.keys().next().value;
      if (oldestId === undefined) break;
      this.entries.delete(oldestId);
    }

    const value = this.createValue();
    this.entries.set(id, { value, touchedAt: now });
    return value;
  }

  get size(): number {
    this.prune(this.now());
    return this.entries.size;
  }

  private prune(now: number): void {
    for (const [id, entry] of this.entries) {
      if (now - entry.touchedAt < this.ttlMs) break;
      this.entries.delete(id);
    }
  }
}
