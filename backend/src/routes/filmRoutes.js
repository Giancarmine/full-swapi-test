const express = require("express");
const { getAllFilms, getFilmById } = require("../controllers/filmController");

const router = express.Router();

router.get("/", getAllFilms);
router.get("/:id", getFilmById);

module.exports = router;

