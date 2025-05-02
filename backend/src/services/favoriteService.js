// In-memory storage for favorites
// In a production environment, this would be stored in a database
const favorites = {
  films: new Set(),
  characters: new Set()
};

const addFavoriteFilm = (id) => {
  favorites.films.add(id);
  return Array.from(favorites.films);
};

const removeFavoriteFilm = (id) => {
  favorites.films.delete(id);
  return Array.from(favorites.films);
};

const getFavoriteFilms = () => {
  return Array.from(favorites.films);
};

const addFavoriteCharacter = (id) => {
  favorites.characters.add(id);
  return Array.from(favorites.characters);
};

const removeFavoriteCharacter = (id) => {
  favorites.characters.delete(id);
  return Array.from(favorites.characters);
};

const getFavoriteCharacters = () => {
  return Array.from(favorites.characters);
};

module.exports = {
  addFavoriteFilm,
  removeFavoriteFilm,
  getFavoriteFilms,
  addFavoriteCharacter,
  removeFavoriteCharacter,
  getFavoriteCharacters
};

