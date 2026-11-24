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
    jest.resetAllMocks();
    cache.clear();
  });

  it("getCharacters throws on invalid response structure", async () => {
    swapiClient.get.mockResolvedValue({ data: {} });
    await expect(characterService.getCharacters()).rejects.toThrow(
      "Invalid API response structure"
    );
  });

  it("getCharacters maps 429 to a rate limit error with status", async () => {
    swapiClient.get.mockRejectedValue({ response: { status: 429 } });
    await expect(characterService.getCharacters()).rejects.toMatchObject({
      status: 429,
      message: "API rate limit exceeded. Please try again later.",
    });
  });

  it("getCharacters avoids the N+1 detail fan-out for large lists", async () => {
    const results = Array.from({ length: 12 }, (_, index) => ({
      uid: String(index + 1),
      name: `Character ${index + 1}`,
      url: `https://www.swapi.tech/api/people/${index + 1}`,
    }));
    swapiClient.get.mockResolvedValue({ data: { results } });

    const characters = await characterService.getCharacters();

    expect(characters).toHaveLength(12);
    expect(swapiClient.get).toHaveBeenCalledTimes(1);
    expect(swapiClient.get).toHaveBeenCalledWith("/people");
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
