const express = require("express");
const { getAllFilms, getFilmById } = require("../controllers/filmController");
const { validateIdParam } = require("../middleware/validateId");
const { listCacheControl } = require("../middleware/cacheControl");

const router = express.Router();

router.get("/", listCacheControl, getAllFilms);
router.get("/:id", validateIdParam("id"), getFilmById);

module.exports = router;
