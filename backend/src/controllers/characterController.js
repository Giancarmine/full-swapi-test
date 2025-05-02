const characterService = require("../services/characterService");

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
    res.json(character);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCharacters,
  getCharacterById,
};

