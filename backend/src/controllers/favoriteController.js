const favoriteService = require("../services/favoriteService");

const getFavorites = (req, res, next) => {
  try {
    const films = favoriteService.getFavoriteFilms();
    const characters = favoriteService.getFavoriteCharacters();
    res.json({ films, characters });
  } catch (error) {
    next(error);
  }
};

const addFavoriteFilm = (req, res, next) => {
  const { id } = req.params;
  try {
    favoriteService.addFavoriteFilm(id);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const addFavoriteCharacter = (req, res, next) => {
  const { id } = req.params;
  try {
    favoriteService.addFavoriteCharacter(id);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const removeFavoriteFilm = (req, res) => {
  const { id } = req.params;
  const success = favoriteService.removeFavoriteFilm(id);
  if (success) {
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Film not found' });
  }
};

const removeFavoriteCharacter = (req, res) => {
  const { id } = req.params;
  const success = favoriteService.removeFavoriteCharacter(id);
  if (success) {
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Character not found' });
  }
};

module.exports = {
  getFavorites,
  addFavoriteFilm,
  addFavoriteCharacter,
  removeFavoriteFilm,
  removeFavoriteCharacter
};
