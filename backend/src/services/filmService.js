const { swapiClient, extractIdFromUrl } = require("../utils/swapiClient");

const getFilms = async () => {
  try {
    const response = await swapiClient.get("/films");
    
    if (!response.data || !response.data.result) {
      throw new Error("Invalid API response structure");
    }
    
    return response.data.result.map(film => ({
      id: extractIdFromUrl(film.properties.url),
      title: film.properties.title,
      director: film.properties.director,
      releaseDate: film.properties.release_date,
      openingCrawl: film.properties.opening_crawl,
      characters: film.properties.characters.map(url => extractIdFromUrl(url)),
      episodeId: film.properties.episode_id,
      coverImage: `https://starwars-visualguide.com/assets/img/films/${extractIdFromUrl(film.properties.url)}.jpg`
    }));
  } catch (error) {
    if (error.response && error.response.status === 429) {
      throw new Error("API rate limit exceeded. Please try again later.");
    }
    console.error("Error fetching films:", error);
    throw error;
  }
};

const getFilmById = async (id) => {
  try {
    const response = await swapiClient.get(`/films/${id}`);
    
    if (!response.data || !response.data.result) {
      throw new Error("Film not found");
    }

    const film = response.data.result.properties;
    
    return {
      id: extractIdFromUrl(film.url),
      title: film.title,
      director: film.director,
      releaseDate: film.release_date,
      openingCrawl: film.opening_crawl,
      characters: film.characters.map(url => extractIdFromUrl(url)),
      episodeId: film.episode_id,
      coverImage: `https://starwars-visualguide.com/assets/img/films/${id}.jpg`
    };
  } catch (error) {
    if (error.response && error.response.status === 429) {
      throw new Error("API rate limit exceeded. Please try again later.");
    }
    console.error(`Error fetching film with ID ${id}:`, error);
    throw error;
  }
};

module.exports = {
  getFilms,
  getFilmById,
};

