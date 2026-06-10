"use client";

import { useCallback, useRef, useState } from "react";

type FetchOnSearchOptions = {
  /** Default cache mode for fetch requests (default: "no-store") */
  cache?: RequestCache;
};

type ExecuteOptions = {
  /** URL to fetch */
  url: string;
  /** Additional fetch options (method, headers, body, etc.) */
  fetchOptions?: Omit<RequestInit, "cache">;
  /** Cache mode override for this specific request */
  cache?: RequestCache;
  /** Whether to silently ignore errors (default: false) */
  silent?: boolean;
};

type FetchOnSearchResult<T = unknown> = {
  /** Latest successfully fetched data, or null if never fetched */
  data: T | null;
  /** Whether a fetch is currently in progress */
  loading: boolean;
  /** Last error message, or null if no error */
  error: string | null;
  /** Execute a fetch — pass URL and optional options */
  execute: <R = T>(opts: ExecuteOptions) => Promise<R | null>;
  /** Reset state back to initial (null data, no error) */
  reset: () => void;
};

/**
 * Generic hook for fetching data from API endpoints on demand.
 *
 * Encapsulates the common pattern of:
 *   fetch(url) → check response.ok → parse JSON → return data
 *
 * Supports AbortController cancellation of in-flight requests.
 */
export function useFetchOnSearch<T = unknown>(
  options?: FetchOnSearchOptions
): FetchOnSearchResult<T> {
  const defaultCache = options?.cache ?? "no-store";

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async <R = T>(opts: ExecuteOptions): Promise<R | null> => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      const { url, fetchOptions, cache, silent = false } = opts;

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          cache: cache ?? defaultCache,
          signal: controller.signal,
        });

        if (!response.ok) {
          // 401 is not an "error" per se — let the caller handle it via status
          if (response.status === 401) {
            setLoading(false);
            return null;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const json: unknown = await response.json();
        const result = json as R;
        setData(result as unknown as T);
        setError(null);
        setLoading(false);
        return result;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Request was cancelled — ignore silently
          setLoading(false);
          return null;
        }

        const message =
          err instanceof Error
            ? err.message
            : "Error desconocido al obtener datos";

        if (!silent) {
          setError(message);
        }
        setLoading(false);
        return null;
      }
    },
    [defaultCache]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, execute, reset };
}
