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

describe("filmService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.clear();
  });

  it("getFilms maps and caches film results", async () => {
    swapiClient.get.mockResolvedValue({
      data: {
        result: [
          {
            properties: {
              url: "https://www.swapi.tech/api/films/1",
              title: "A New Hope",
              director: "George Lucas",
              release_date: "1977-05-25",
              opening_crawl: "crawl",
              characters: ["https://www.swapi.tech/api/people/1"],
              episode_id: 4,
            },
          },
        ],
      },
    });

    const first = await filmService.getFilms();
    const second = await filmService.getFilms();

    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({ id: "1", title: "A New Hope", episodeId: 4 });
    expect(second).toEqual(first);
    expect(swapiClient.get).toHaveBeenCalledTimes(1);
  });

  it("getFilmById returns mapped film", async () => {
    swapiClient.get.mockResolvedValue({
      data: {
        result: {
          properties: {
            url: "https://www.swapi.tech/api/films/2",
            title: "Empire",
            director: "Irvin Kershner",
            release_date: "1980-05-17",
            opening_crawl: "crawl",
            characters: [],
            episode_id: 5,
          },
        },
      },
    });

    const film = await filmService.getFilmById("2");
    expect(film).toMatchObject({ id: "2", title: "Empire" });
  });

  it("getFilmById throws 404 for missing film", async () => {
    swapiClient.get.mockResolvedValue({ data: {} });
    await expect(filmService.getFilmById("999")).rejects.toMatchObject({ status: 404 });
  });
});
