import type { SearchMode } from "@/features/price-query/presentation";

export function buildSearchUrl(
  pathname: string,
  currentParams: string,
  mode: SearchMode,
  normalizedQuery: string,
) {
  const params = new URLSearchParams(currentParams);
  params.set("mode", mode);

  if (normalizedQuery) {
    params.set("q", normalizedQuery);
  } else {
    params.delete("q");
  }

  const next = params.toString();
  return next ? `${pathname}?${next}` : pathname;
}

export function shouldRecordSearchActivity(input: {
  currentUrl: string;
  nextUrl: string;
  normalizedQuery: string;
  lastTrackedQuery: string | null;
}) {
  if (!input.normalizedQuery) {
    return false;
  }

  if (input.currentUrl === input.nextUrl) {
    return false;
  }

  return input.lastTrackedQuery !== input.normalizedQuery;
}
