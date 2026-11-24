const { swapiClient, extractIdFromUrl } = require("../utils/swapiClient");
const cache = require("../utils/cache");

const getCharacters = async () =>
  cache.getOrSet("characters:all", async () => {
    try {
      const response = await swapiClient.get("/people");

      if (!response.data || !response.data.results) {
        throw new Error("Invalid API response structure");
      }

      // The list endpoint only needs summaries. Details are fetched lazily by
      // getCharacterById (and cached there), avoiding one upstream call per row.
      return response.data.results.map((char) => ({
        id: char.uid,
        name: char.name,
        url: char.url,
        image: `https://starwars-visualguide.com/assets/img/characters/${char.uid}.jpg`,
      }));
    } catch (error) {
      if (error.response && error.response.status === 429) {
        const rateLimitError = new Error("API rate limit exceeded. Please try again later.");
        rateLimitError.status = 429;
        throw rateLimitError;
      }
      console.error("Error fetching characters:", error);
      throw error;
    }
  });

const getCharacterById = async (id) =>
  cache.getOrSet(`characters:${id}`, async () => {
    try {
      const response = await swapiClient.get(`/people/${id}`);

      if (!response.data || !response.data.result) {
        const notFoundError = new Error("Character not found");
        notFoundError.status = 404;
        throw notFoundError;
      }

      const character = response.data.result.properties;
      let homeworldName = "Unknown";

      // Fetch homeworld details if available
      if (character.homeworld) {
        try {
          const homeworldResponse = await swapiClient.get(character.homeworld);
          homeworldName = homeworldResponse.data.result?.properties?.name || "Unknown";
        } catch (error) {
          console.error(`Error fetching homeworld for character ${id}:`, error);
        }
      }

      return {
        id: response.data.result.uid,
        name: character.name,
        gender: character.gender,
        birthYear: character.birth_year,
        height: character.height,
        mass: character.mass,
        hairColor: character.hair_color,
        eyeColor: character.eye_color,
        skinColor: character.skin_color,
        homeworld: {
          id: extractIdFromUrl(character.homeworld),
          name: homeworldName,
        },
        image: `https://starwars-visualguide.com/assets/img/characters/${id}.jpg`,
      };
    } catch (error) {
      if (error.response?.status === 404) {
        const notFoundError = new Error("Character not found");
        notFoundError.status = 404;
        throw notFoundError;
      }
      if (error.response?.status === 429) {
        const rateLimitError = new Error("API rate limit exceeded. Please try again later.");
        rateLimitError.status = 429;
        throw rateLimitError;
      }
      console.error(`Error fetching character with ID ${id}:`, error);
      error.status = error.status || 500;
      throw error;
    }
  });

module.exports = {
  getCharacters,
  getCharacterById,
};
