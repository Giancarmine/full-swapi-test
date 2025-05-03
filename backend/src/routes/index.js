const express = require("express");
const filmRoutes = require("./filmRoutes");
const characterRoutes = require("./characterRoutes");
const favoriteRoutes = require("./favoriteRoutes");

const router = express.Router();

router.use("/films", filmRoutes);
router.use("/characters", characterRoutes);
router.use("/favorites", favoriteRoutes);

module.exports = router;
