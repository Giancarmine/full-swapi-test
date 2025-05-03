const { swapiClient, extractIdFromUrl } = require("../utils/swapiClient");

const getCharacters = async () => {
  try {
    const response = await swapiClient.get("/people");
    
    if (!response.data || !response.data.results) {
      throw new Error("Invalid API response structure");
    }
    
    // First get the basic character list
    const characterList = response.data.results.map(char => ({
      id: char.uid,
      name: char.name,
      url: char.url
    }));

    // Then fetch details for each character
    const charactersWithDetails = await Promise.all(
      characterList.map(async char => {
        try {
          const detailsResponse = await swapiClient.get(`/people/${char.id}`);
          if (!detailsResponse.data || !detailsResponse.data.result) {
            return char; // Return basic info if details fail
          }
          
          const details = detailsResponse.data.result.properties;
          return {
            ...char,
            gender: details.gender,
            birthYear: details.birth_year,
            height: details.height,
            mass: details.mass,
            homeworld: extractIdFromUrl(details.homeworld),
            image: `https://starwars-visualguide.com/assets/img/characters/${char.id}.jpg`
          };
        } catch (error) {
          console.error(`Error fetching details for character ${char.id}:`, error);
          return char; // Return basic info if details fail
        }
      })
    );

    return charactersWithDetails;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      throw new Error("API rate limit exceeded. Please try again later.");
    }
    console.error("Error fetching characters:", error);
    throw error;
  }
};

const getCharacterById = async (id) => {
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
        name: homeworldName
      },
      image: `https://starwars-visualguide.com/assets/img/characters/${id}.jpg`
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
};

module.exports = {
  getCharacters,
  getCharacterById,
};
