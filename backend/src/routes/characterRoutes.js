const express = require("express");
const { getAllCharacters, getCharacterById } = require("../controllers/characterController");
const { validateIdParam } = require("../middleware/validateId");
const { listCacheControl } = require("../middleware/cacheControl");

const router = express.Router();

router.get("/", listCacheControl, getAllCharacters);
router.get("/:id", validateIdParam("id"), getCharacterById);

module.exports = router;
