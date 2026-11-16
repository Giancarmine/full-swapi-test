const express = require("express");
const { getAllCharacters, getCharacterById } = require("../controllers/characterController");
const { validateIdParam } = require("../middleware/validateId");

const router = express.Router();

router.get("/", getAllCharacters);
router.get("/:id", validateIdParam("id"), getCharacterById);

module.exports = router;
