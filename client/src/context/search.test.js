import { act, renderHook, waitFor } from "@testing-library/react";
import { SearchProvider, useSearch } from "./search";
import "@testing-library/jest-dom";

describe("Search Context", () => {
  it("Should be initialised with default values", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchProvider,
    });
    expect(result.current[0]).toEqual({ keyword: "", results: [] });
  });

  it("Should update search object when setSearch is called", async () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchProvider,
    });
    const mockSearch = {
      keyword: "test",
      results: [{ id: 1, name: "Test" }],
    };

    act(() => {
      result.current[1](mockSearch);
    });

    await waitFor(() => {
      expect(result.current[0]).toStrictEqual(mockSearch);
    });
  });
});
