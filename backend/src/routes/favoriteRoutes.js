const express = require("express");
const { 
  getFavorites,
  addFavoriteFilm,
  removeFavoriteFilm,
  addFavoriteCharacter,
  removeFavoriteCharacter
} = require("../controllers/favoriteController");

const router = express.Router();

router.get("/", getFavorites);
router.post("/films/:id", addFavoriteFilm);
router.delete("/films/:id", removeFavoriteFilm);
router.post("/characters/:id", addFavoriteCharacter);
router.delete("/characters/:id", removeFavoriteCharacter);

module.exports = router;

