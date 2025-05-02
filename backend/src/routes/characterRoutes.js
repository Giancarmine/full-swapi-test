const express = require("express");
const { getAllCharacters, getCharacterById } = require("../controllers/characterController");

const router = express.Router();

router.get("/", getAllCharacters);
router.get("/:id", getCharacterById);

module.exports = router;

