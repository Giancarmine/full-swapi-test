const filmService = require("../services/filmService");

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
      return res.status(404).json({ error: 'Film not found' });
    }
    
    res.status(200).json(film);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    if (error.status === 429) {
      return res.status(429).json({ error: error.message });
    }
    next(error);
  }
};

module.exports = {
  getAllFilms,
  getFilmById,
};
