const filmService = require("../services/filmService");

const getAllFilms = async (req, res, next) => {
  try {
    const films = await filmService.getFilms();
    res.json(films);
  } catch (error) {
    next(error);
  }
};

const getFilmById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const film = await filmService.getFilmById(id);
    res.json(film);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFilms,
  getFilmById,
};

