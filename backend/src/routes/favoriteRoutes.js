const express = require("express");
const {
  getFavorites,
  addFavoriteFilm,
  removeFavoriteFilm,
  addFavoriteCharacter,
  removeFavoriteCharacter,
} = require("../controllers/favoriteController");
const { validateIdParam } = require("../middleware/validateId");

const router = express.Router();

router.get("/", getFavorites);
router.post("/films/:id", validateIdParam("id"), addFavoriteFilm);
router.delete("/films/:id", validateIdParam("id"), removeFavoriteFilm);
router.post("/characters/:id", validateIdParam("id"), addFavoriteCharacter);
router.delete("/characters/:id", validateIdParam("id"), removeFavoriteCharacter);

module.exports = router;
