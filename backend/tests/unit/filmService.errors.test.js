jest.mock("../../src/utils/swapiClient", () => ({
  swapiClient: { get: jest.fn() },
  extractIdFromUrl: (url) => {
    if (!url) return null;
    const m = url.match(/\/(\d+)\/?$/);
    return m ? m[1] : null;
  },
}));

const { swapiClient } = require("../../src/utils/swapiClient");
const cache = require("../../src/utils/cache");
const filmService = require("../../src/services/filmService");

describe("filmService error branches", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.clear();
  });

  it("getFilms throws on invalid API response structure", async () => {
    swapiClient.get.mockResolvedValue({ data: {} });
    await expect(filmService.getFilms()).rejects.toThrow("Invalid API response structure");
  });

  it("getFilms maps 429 response to friendly error", async () => {
    swapiClient.get.mockRejectedValue({ response: { status: 429 } });
    await expect(filmService.getFilms()).rejects.toThrow(
      "API rate limit exceeded. Please try again later."
    );
  });

  it("getFilmById maps 429 to rate limit error with status", async () => {
    swapiClient.get.mockRejectedValue({ response: { status: 429 } });
    await expect(filmService.getFilmById("1")).rejects.toMatchObject({
      status: 429,
      message: "API rate limit exceeded. Please try again later.",
    });
  });

  it("getFilmById marks 404 errors with status", async () => {
    swapiClient.get.mockRejectedValue({ response: { status: 404 }, message: "Not found" });
    await expect(filmService.getFilmById("999")).rejects.toMatchObject({ status: 404 });
  });

  it("getFilmById defaults to 500 for unknown errors", async () => {
    swapiClient.get.mockRejectedValue(new Error("boom"));
    await expect(filmService.getFilmById("1")).rejects.toMatchObject({ status: 500 });
  });
});
