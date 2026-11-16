const characterService = require("../services/characterService");
const { notFound } = require("../utils/httpError");

const getAllCharacters = async (req, res, next) => {
  try {
    const characters = await characterService.getCharacters();
    res.json(characters);
  } catch (error) {
    next(error);
  }
};

const getCharacterById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const character = await characterService.getCharacterById(id);

    if (!character) {
      return next(notFound("Character not found"));
    }

    return res.status(200).json(character);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllCharacters,
  getCharacterById,
};
