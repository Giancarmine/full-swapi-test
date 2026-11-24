import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api.js";

function response(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn(async () => body),
  };
}

describe("api.request", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("uses same-origin paths and a default anonymous user id", async () => {
    global.fetch.mockResolvedValue(response({ status: "ok" }));

    await expect(api.getHealth()).resolves.toEqual({ status: "ok" });
    expect(global.fetch).toHaveBeenCalledWith(
      "/health",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-User-Id": "anonymous",
        }),
      })
    );
  });

  it("sends the provided user id on favorite requests", async () => {
    global.fetch.mockResolvedValue(response({ films: [], characters: [] }));

    await api.getFavorites("alice");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/favorites",
      expect.objectContaining({ headers: expect.objectContaining({ "X-User-Id": "alice" }) })
    );
  });

  it("falls back to anonymous for an empty user id", async () => {
    global.fetch.mockResolvedValue(response({ films: [], characters: [] }));

    await api.getFavorites("");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/favorites",
      expect.objectContaining({ headers: expect.objectContaining({ "X-User-Id": "anonymous" }) })
    );
  });

  it("maps each favorite operation to the expected path and method", async () => {
    global.fetch.mockResolvedValue(response({ success: true }, 201));

    await api.addFavoriteFilm("1", "u1");
    await api.removeFavoriteFilm("1", "u1");
    await api.addFavoriteCharacter("2", "u1");
    await api.removeFavoriteCharacter("2", "u1");

    const calls = global.fetch.mock.calls;
    expect(calls[0][0]).toBe("/api/favorites/films/1");
    expect(calls[0][1].method).toBe("POST");
    expect(calls[1][0]).toBe("/api/favorites/films/1");
    expect(calls[1][1].method).toBe("DELETE");
    expect(calls[2][0]).toBe("/api/favorites/characters/2");
    expect(calls[2][1].method).toBe("POST");
    expect(calls[3][0]).toBe("/api/favorites/characters/2");
    expect(calls[3][1].method).toBe("DELETE");
  });

  it("preserves caller-provided headers", async () => {
    global.fetch.mockResolvedValue(response([]));

    await api.getCharacters();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/characters",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
  });

  it("returns null for 204 responses without parsing a body", async () => {
    const noContent = { ok: true, status: 204, json: vi.fn() };
    global.fetch.mockResolvedValue(noContent);

    await expect(api.removeFavoriteFilm("1", "u1")).resolves.toBeNull();
    expect(noContent.json).not.toHaveBeenCalled();
  });

  it("throws an error carrying the API message, status, and code", async () => {
    global.fetch.mockResolvedValue(response({ error: "boom", code: "rate_limited" }, 429));

    await expect(api.getFilms()).rejects.toMatchObject({
      message: "boom",
      status: 429,
      code: "rate_limited",
    });
  });

  it("falls back to the message field when error is absent", async () => {
    global.fetch.mockResolvedValue(response({ message: "not found" }, 404));

    await expect(api.getFilms()).rejects.toMatchObject({ message: "not found", status: 404 });
  });

  it("falls back to a generic message when the error body has no message", async () => {
    global.fetch.mockResolvedValue(response({}, 503));

    await expect(api.getFilms()).rejects.toMatchObject({
      message: "Request failed (503)",
      status: 503,
    });
  });

  it("tolerates non-JSON error bodies", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(async () => {
        throw new SyntaxError("unexpected token");
      }),
    });

    await expect(api.getFilms()).rejects.toMatchObject({
      message: "Request failed (500)",
      status: 500,
    });
  });
});
