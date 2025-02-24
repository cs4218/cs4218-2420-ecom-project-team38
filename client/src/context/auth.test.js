import { act, renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./auth";
import "@testing-library/jest-dom";

Object.defineProperty(window, "localStorage", {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

describe("Auth Context", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("Should be initialised with default values", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current[0]).toEqual({ user: null, token: "" });
  });

  it("Should set the user and token if data is present in local storage", async () => {
    const mockUser = {
      _id: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: "88888888",
      address: "Test address",
      role: 0,
    };
    const mockToken = "mock token";
    window.localStorage.getItem = jest
      .fn()
      .mockReturnValue(JSON.stringify({ user: mockUser, token: mockToken }));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(localStorage.getItem).toBeCalledWith("auth");
    await waitFor(() =>
      expect(result.current[0]).toStrictEqual({
        user: mockUser,
        token: mockToken,
      })
    );
  });

  it("Should update auth object when setAuth is called", async () => {
    const mockUser = {
      _id: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: "88888888",
      address: "Test address",
      role: 0,
    };
    const mockToken = "mock token";

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    act(() => result.current[1]({ user: mockUser, token: mockToken }));
    expect(result.current[0]).toStrictEqual({
      user: mockUser,
      token: mockToken,
    });
  });
});
