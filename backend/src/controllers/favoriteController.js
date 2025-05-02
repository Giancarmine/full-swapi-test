const favoriteService = require("../services/favoriteService");

const getFavorites = (req, res) => {
  res.json({
    films: favoriteService.getFavoriteFilms(),
    characters: favoriteService.getFavoriteCharacters()
  });
};

const addFavoriteFilm = (req, res, next) => {
  try {
    const { id } = req.params;
    const favorites = favoriteService.addFavoriteFilm(id);
    res.json({ films: favorites });
  } catch (error) {
    next(error);
  }
};

const removeFavoriteFilm = (req, res, next) => {
  try {
    const { id } = req.params;
    const favorites = favoriteService.removeFavoriteFilm(id);
    res.json({ films: favorites });
  } catch (error) {
    next(error);
  }
};

const addFavoriteCharacter = (req, res, next) => {
  try {
    const { id } = req.params;
    const favorites = favoriteService.addFavoriteCharacter(id);
    res.json({ characters: favorites });
  } catch (error) {
    next(error);
  }
};

const removeFavoriteCharacter = (req, res, next) => {
  try {
    const { id } = req.params;
    const favorites = favoriteService.removeFavoriteCharacter(id);
    res.json({ characters: favorites });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavorites,
  addFavoriteFilm,
  removeFavoriteFilm,
  addFavoriteCharacter,
  removeFavoriteCharacter
};

