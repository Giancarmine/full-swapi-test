const filmService = require("../services/filmService");
const { notFound } = require("../utils/httpError");

const getAllFilms = async (req, res, next) => {
  try {
    const films = await filmService.getFilms();
    res.status(200).json(films);
  } catch (error) {
    next(error);
  }
};

const getFilmById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const film = await filmService.getFilmById(id);

    if (!film) {
      return next(notFound("Film not found"));
    }

    return res.status(200).json(film);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllFilms,
  getFilmById,
};
