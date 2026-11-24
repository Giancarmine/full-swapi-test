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

describe("characterService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    cache.clear();
  });

  it("getCharacters fetches only the list once and caches the result", async () => {
    swapiClient.get.mockResolvedValue({
      data: {
        results: [{ uid: "1", name: "Luke Skywalker", url: "https://www.swapi.tech/api/people/1" }],
      },
    });

    const first = await characterService.getCharacters();
    const second = await characterService.getCharacters();

    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({
      id: "1",
      name: "Luke Skywalker",
      url: "https://www.swapi.tech/api/people/1",
      image: "https://starwars-visualguide.com/assets/img/characters/1.jpg",
    });
    expect(second).toEqual(first);
    expect(swapiClient.get).toHaveBeenCalledTimes(1);
    expect(swapiClient.get).toHaveBeenCalledWith("/people");
  });

  it("getCharacterById returns mapped character with homeworld name", async () => {
    swapiClient.get
      .mockResolvedValueOnce({
        data: {
          result: {
            uid: "1",
            properties: {
              name: "Luke Skywalker",
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
      .mockResolvedValueOnce({
        data: { result: { properties: { name: "Tatooine" } } },
      });

    const character = await characterService.getCharacterById("1");
    expect(character).toMatchObject({
      id: "1",
      name: "Luke Skywalker",
      homeworld: { id: "1", name: "Tatooine" },
    });
  });

  it("getCharacterById throws 404 for missing character", async () => {
    swapiClient.get.mockResolvedValue({ data: {} });
    await expect(characterService.getCharacterById("999")).rejects.toMatchObject({ status: 404 });
  });
});
