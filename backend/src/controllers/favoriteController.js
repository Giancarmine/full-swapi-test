const favoriteService = require("../services/favoriteService");
const { notFound } = require("../utils/httpError");

const getUserId = (req) => req.userId || "anonymous";

const getFavorites = (req, res, next) => {
  try {
    const userId = getUserId(req);
    const films = favoriteService.getFavoriteFilms(userId);
    const characters = favoriteService.getFavoriteCharacters(userId);
    res.json({ films, characters });
  } catch (error) {
    next(error);
  }
};

const addFavoriteFilm = (req, res, next) => {
  const { id } = req.params;
  try {
    favoriteService.addFavoriteFilm(id, getUserId(req));
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const addFavoriteCharacter = (req, res, next) => {
  const { id } = req.params;
  try {
    favoriteService.addFavoriteCharacter(id, getUserId(req));
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const removeFavoriteFilm = (req, res, next) => {
  const { id } = req.params;
  try {
    const removed = favoriteService.removeFavoriteFilm(id, getUserId(req));
    if (!removed) return next(notFound("Favorite film not found"));
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const removeFavoriteCharacter = (req, res, next) => {
  const { id } = req.params;
  try {
    const removed = favoriteService.removeFavoriteCharacter(id, getUserId(req));
    if (!removed) return next(notFound("Favorite character not found"));
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getFavorites,
  addFavoriteFilm,
  addFavoriteCharacter,
  removeFavoriteFilm,
  removeFavoriteCharacter,
};
