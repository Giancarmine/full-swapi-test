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
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    res.status(200).json(character);
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
  getAllCharacters,
  getCharacterById,
};
