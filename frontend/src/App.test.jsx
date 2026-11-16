import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App.jsx";

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

beforeEach(() => {
  global.fetch = vi.fn(async (url, options = {}) => {
    const u = String(url);
    if (u.includes("/api/films")) return jsonResponse([{ id: "1", title: "A New Hope", director: "George Lucas" }]);
    if (u.includes("/api/characters")) return jsonResponse([{ id: "10", name: "Luke Skywalker" }]);
    if (u.includes("/api/favorites/films/1") && options.method === "POST") return jsonResponse({ success: true }, 201);
    if (u.includes("/api/favorites/films/1") && options.method === "DELETE") return { ok: true, status: 204, json: async () => ({}) };
    if (u.includes("/api/favorites")) return jsonResponse({ films: [], characters: [] });
    return jsonResponse({ status: "ok" });
  });
});

describe("App", () => {
  it("renders main sections and loaded data", async () => {
    render(<App />);
    expect(screen.getByText("SWAPI Explorer")).toBeInTheDocument();
    expect(await screen.findByText("A New Hope")).toBeInTheDocument();
    expect(await screen.findByText("Luke Skywalker")).toBeInTheDocument();
  });

  it("sends X-User-Id when reloading for a different user", async () => {
    render(<App />);
    await screen.findByText("A New Hope");

    const input = screen.getByLabelText(/user id/i);
    fireEvent.change(input, { target: { value: "alice" } });
    fireEvent.click(screen.getByRole("button", { name: /reload/i }));

    await waitFor(() => {
      const favCalls = global.fetch.mock.calls.filter(([url]) => String(url).includes("/api/favorites"));
      expect(favCalls.some(([, opts]) => opts?.headers?.["X-User-Id"] === "alice")).toBe(true);
    });
  });

  it("toggles a film favorite and refreshes favorites", async () => {
    const favStates = [{ films: [], characters: [] }, { films: ["1"], characters: [] }];
    let favIndex = 0;
    global.fetch = vi.fn(async (url, options = {}) => {
      const u = String(url);
      if (u.includes("/api/films")) return jsonResponse([{ id: "1", title: "A New Hope" }]);
      if (u.includes("/api/characters")) return jsonResponse([]);
      if (u.includes("/api/favorites/films/1") && options.method === "POST") return jsonResponse({ success: true }, 201);
      if (u.endsWith("/api/favorites")) {
        const body = favStates[Math.min(favIndex, favStates.length - 1)];
        favIndex += 1;
        return jsonResponse(body);
      }
      return jsonResponse({});
    });

    render(<App />);
    await screen.findByText("A New Hope");
    fireEvent.click(screen.getByRole("button", { name: /add favorite film/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/favorites/films/1"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("shows an error and allows retry when loading fails", async () => {
    let calls = 0;
    global.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes("/api/films")) {
        calls += 1;
        if (calls === 1) return jsonResponse({ error: "boom" }, 500);
        return jsonResponse([{ id: "1", title: "A New Hope" }]);
      }
      if (u.includes("/api/characters")) return jsonResponse([]);
      if (u.includes("/api/favorites")) return jsonResponse({ films: [], characters: [] });
      return jsonResponse({});
    });

    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/boom/i);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(await screen.findByText("A New Hope")).toBeInTheDocument();
  });
});
