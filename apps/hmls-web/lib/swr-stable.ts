import { useMemo } from "react";

const EMPTY: readonly never[] = Object.freeze([]);

/** SWR returns a stable reference for `data` while it's defined, but `data ?? []`
 * creates a fresh `[]` every render when data is `undefined`, which breaks
 * downstream `useEffect` / `useMemo` deps. This memoizes to the same empty
 * array reference across renders. */
export function useStableArray<T>(data: T[] | undefined): T[] {
  return useMemo(() => data ?? (EMPTY as unknown as T[]), [data]);
}
