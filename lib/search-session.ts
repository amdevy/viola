/**
 * What the phone search remembers between openings and across Back.
 *
 * - The query lives in sessionStorage, so reopening the search (or coming back
 *   to it) shows what the shopper last typed. Storage can throw (private mode,
 *   blocked site data); then the search simply starts empty.
 * - "Return to the search" is a marker on the history entry the shopper left
 *   from a result. Back to that entry reopens the search (see Header).
 *
 * Next's App Router keeps its own data in history.state (`__NA` and the
 * router tree) and reloads the page on popstate if `__NA` is missing, so the
 * marker is always written over a copy of the existing state. Because that
 * copy carries `__NA`, Next's patched replaceState passes it straight through
 * without touching the router; and a Back/Forward traversal re-applies the
 * entry with `preserveCustomHistoryState`, so the marker survives (Next 16.2,
 * client/components/app-router.js and segment-cache/navigation.js).
 *
 * Browser-only: call these from event handlers and effects, never in render.
 */

const QUERY_KEY = "viola:search-query";
const MARKER = "violaSearch";

export interface SearchMarker {
  /** Scroll offset of the results list when the shopper left. */
  scrollTop: number;
}

export function readStoredQuery(): string {
  try {
    return window.sessionStorage.getItem(QUERY_KEY) ?? "";
  } catch {
    return "";
  }
}

export function storeQuery(query: string): void {
  try {
    if (query) window.sessionStorage.setItem(QUERY_KEY, query);
    else window.sessionStorage.removeItem(QUERY_KEY);
  } catch {
    // Nothing to remember then; the search still works.
  }
}

export function readSearchMarker(): SearchMarker | null {
  const marker = (window.history.state as Record<string, unknown> | null)?.[MARKER];
  if (!marker || typeof marker !== "object") return null;
  const scrollTop = Number((marker as { scrollTop?: unknown }).scrollTop);
  return { scrollTop: Number.isFinite(scrollTop) ? scrollTop : 0 };
}

/** Marks the current history entry so that Back to it reopens the search. */
export function markSearchEntry(marker: SearchMarker): void {
  window.history.replaceState({ ...window.history.state, [MARKER]: marker }, "");
}

/** The shopper closed the search: Back/Forward must not bring it back. */
export function clearSearchMarker(): void {
  const state = window.history.state as Record<string, unknown> | null;
  if (!state || !(MARKER in state)) return;
  const { [MARKER]: _removed, ...rest } = state;
  void _removed;
  window.history.replaceState(rest, "");
}
