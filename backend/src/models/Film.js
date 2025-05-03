const mongoose = require('mongoose');

const filmSchema = new mongoose.Schema({
  title: String,
  episode_id: Number,
  director: String,
  producer: String,
  release_date: Date,
  characters: [String],
  planets: [String],
  starships: [String],
  vehicles: [String],
  species: [String],
  created: Date,
  edited: Date,
  url: String
});

module.exports = mongoose.model('Film', filmSchema);
