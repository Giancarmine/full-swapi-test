const { swapiClient, extractIdFromUrl } = require("../utils/swapiClient");
const cache = require("../utils/cache");

const mapFilm = (film, idOverride) => {
  const id = idOverride || extractIdFromUrl(film.url);
  return {
    id,
    title: film.title,
    director: film.director,
    releaseDate: film.release_date,
    openingCrawl: film.opening_crawl,
    characters: (film.characters || []).map((url) => extractIdFromUrl(url)),
    episodeId: film.episode_id,
    coverImage: `https://starwars-visualguide.com/assets/img/films/${id}.jpg`,
  };
};

const getFilms = async () =>
  cache.getOrSet("films:all", async () => {
    try {
      const response = await swapiClient.get("/films");

      if (!response.data || !response.data.result) {
        throw new Error("Invalid API response structure");
      }

      return response.data.result.map((film) => mapFilm(film.properties));
    } catch (error) {
      if (error.response && error.response.status === 429) {
        throw new Error("API rate limit exceeded. Please try again later.");
      }
      console.error("Error fetching films:", error);
      throw error;
    }
  });

const getFilmById = async (id) =>
  cache.getOrSet(`films:${id}`, async () => {
    try {
      const response = await swapiClient.get(`/films/${id}`);

      if (!response.data || !response.data.result) {
        const notFoundError = new Error("Film not found");
        notFoundError.status = 404;
        throw notFoundError;
      }

      return mapFilm(response.data.result.properties, String(id));
    } catch (error) {
      if (error.response?.status === 429) {
        const rateLimitError = new Error("API rate limit exceeded. Please try again later.");
        rateLimitError.status = 429;
        throw rateLimitError;
      }

      if (error.response?.status === 404) {
        error.status = 404;
      } else {
        error.status = error.status || 500;
      }
      console.error(`Error fetching film with ID ${id}:`, error);
      throw error;
    }
  });

module.exports = {
  getFilms,
  getFilmById,
};
