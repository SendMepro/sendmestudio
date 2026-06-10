// src/adapters/LocalStorageAdapter.ts
// Purpose: Generic localStorage adapter for repository pattern.
// Provides typed JSON get/set with SSR-safe checks and error handling.
// Swappable: replace with AsyncStorageAdapter for server-side storage.
// Phase 2.7 — W6 Platform Health Repository Migration

export class LocalStorageAdapter {
  private isAvailable(): boolean {
    return typeof window !== 'undefined' && window.localStorage !== null;
  }

  /**
   * Read and parse a JSON value from localStorage.
   * Returns default value when key doesn't exist, SSR, or parse error.
   */
  getJSON<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) return defaultValue;

    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Serialize and write a JSON value to localStorage.
   * Silently fails when SSR or storage is full.
   */
  setJSON<T>(key: string, value: T): void {
    if (!this.isAvailable()) return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silently fail — localStorage can throw if full or disabled
    }
  }

  /**
   * Remove a key from localStorage.
   */
  remove(key: string): void {
    if (!this.isAvailable()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Silently fail
    }
  }

  /**
   * Check if a key exists in localStorage.
   */
  has(key: string): boolean {
    if (!this.isAvailable()) return false;
    try {
      return window.localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }
}

// Singleton for app-wide use
export const localStorageAdapter = new LocalStorageAdapter();
