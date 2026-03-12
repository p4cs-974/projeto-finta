import { SearchClient } from "@/components/search/search-client";
import {
  normalizeSearchInput,
  type SearchMode,
} from "@/features/price-query/presentation";

interface SearchPageProps {
  searchParams: Promise<{
    mode?: string;
    q?: string;
  }>;
}

function parseMode(mode: string | undefined): SearchMode {
  return mode === "crypto" ? "crypto" : "stocks";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const initialMode = parseMode(params.mode);
  const initialQuery = normalizeSearchInput(params.q ?? "");

  return <SearchClient initialMode={initialMode} initialQuery={initialQuery} />;
}
