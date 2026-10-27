"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
export function useResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(!!path);
  const version = useRef(0);
  const load = useCallback(async () => {
    const current = ++version.current;
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await api<T>(path);
      if (current === version.current) setData(result);
    } catch (e) {
      if (current === version.current)
        setError(e instanceof Error ? e.message : "Could not load this page.");
    } finally {
      if (current === version.current) setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    void load();
    return () => {
      version.current++;
    };
  }, [load]);
  return { data, setData, error, loading, load };
}
