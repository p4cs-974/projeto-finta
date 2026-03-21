import { describe, expect, it } from "vitest";

import {
  buildSearchUrl,
  shouldRecordSearchActivity,
} from "./search-controls.helpers";

describe("search-controls helpers", () => {
  it("builds the normalized search url", () => {
    expect(buildSearchUrl("/search", "", "stocks", "PETR4")).toBe(
      "/search?mode=stocks&q=PETR4",
    );
    expect(
      buildSearchUrl("/search", "mode=stocks&q=PETR4", "stocks", ""),
    ).toBe("/search?mode=stocks");
  });

  it("records a debounced search only when the normalized query changes and the url changes", () => {
    expect(
      shouldRecordSearchActivity({
        currentUrl: "/search?mode=stocks",
        nextUrl: "/search?mode=stocks&q=PETR",
        normalizedQuery: "PETR",
        lastTrackedQuery: null,
      }),
    ).toBe(true);

    expect(
      shouldRecordSearchActivity({
        currentUrl: "/search?mode=stocks&q=PETR",
        nextUrl: "/search?mode=crypto&q=PETR",
        normalizedQuery: "PETR",
        lastTrackedQuery: "PETR",
      }),
    ).toBe(false);

    expect(
      shouldRecordSearchActivity({
        currentUrl: "/search?mode=stocks&q=PETR",
        nextUrl: "/search?mode=stocks&q=PETR",
        normalizedQuery: "PETR",
        lastTrackedQuery: null,
      }),
    ).toBe(false);

    expect(
      shouldRecordSearchActivity({
        currentUrl: "/search?mode=stocks&q=PETR",
        nextUrl: "/search?mode=stocks",
        normalizedQuery: "",
        lastTrackedQuery: null,
      }),
    ).toBe(false);
  });
});
