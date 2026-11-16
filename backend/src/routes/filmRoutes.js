const express = require("express");
const { getAllFilms, getFilmById } = require("../controllers/filmController");
const { validateIdParam } = require("../middleware/validateId");

const router = express.Router();

router.get("/", getAllFilms);
router.get("/:id", validateIdParam("id"), getFilmById);

module.exports = router;
