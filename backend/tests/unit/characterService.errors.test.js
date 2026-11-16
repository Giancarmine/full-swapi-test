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
const characterService = require("../../src/services/characterService");

describe("characterService error and fallback branches", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.clear();
  });

  it("getCharacters throws on invalid response structure", async () => {
    swapiClient.get.mockResolvedValue({ data: {} });
    await expect(characterService.getCharacters()).rejects.toThrow(
      "Invalid API response structure"
    );
  });

  it("getCharacters maps 429 to friendly error", async () => {
    swapiClient.get.mockRejectedValue({ response: { status: 429 } });
    await expect(characterService.getCharacters()).rejects.toThrow(
      "API rate limit exceeded. Please try again later."
    );
  });

  it("getCharacters falls back to basic info when detail fetch fails", async () => {
    swapiClient.get
      .mockResolvedValueOnce({
        data: { results: [{ uid: "1", name: "Luke", url: "https://www.swapi.tech/api/people/1" }] },
      })
      .mockRejectedValueOnce(new Error("detail fail"));

    const result = await characterService.getCharacters();
    expect(result).toEqual([{ id: "1", name: "Luke", url: "https://www.swapi.tech/api/people/1" }]);
  });

  it("getCharacters falls back when detail response is invalid", async () => {
    swapiClient.get
      .mockResolvedValueOnce({
        data: { results: [{ uid: "2", name: "Leia", url: "u" }] },
      })
      .mockResolvedValueOnce({ data: {} });

    const result = await characterService.getCharacters();
    expect(result).toEqual([{ id: "2", name: "Leia", url: "u" }]);
  });

  it("getCharacterById maps 429 to rate limit error with status", async () => {
    swapiClient.get.mockRejectedValue({ response: { status: 429 } });
    await expect(characterService.getCharacterById("1")).rejects.toMatchObject({ status: 429 });
  });

  it("getCharacterById sets default 500 status for unknown errors", async () => {
    swapiClient.get.mockRejectedValue(new Error("boom"));
    await expect(characterService.getCharacterById("1")).rejects.toMatchObject({ status: 500 });
  });

  it("getCharacterById keeps homeworld unknown when homeworld fetch fails", async () => {
    swapiClient.get
      .mockResolvedValueOnce({
        data: {
          result: {
            uid: "1",
            properties: {
              name: "Luke",
              gender: "male",
              birth_year: "19BBY",
              height: "172",
              mass: "77",
              hair_color: "blond",
              eye_color: "blue",
              skin_color: "fair",
              homeworld: "https://www.swapi.tech/api/planets/1",
            },
          },
        },
      })
      .mockRejectedValueOnce(new Error("homeworld fail"));

    const result = await characterService.getCharacterById("1");
    expect(result.homeworld).toEqual({ id: "1", name: "Unknown" });
  });
});
