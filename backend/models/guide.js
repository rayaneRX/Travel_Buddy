const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  specialites: [String], // Un tableau de spécialités (ex: "randonnée", "histoire", "gastronomie")
  destinations: [String], // Un tableau de destinations où le guide opère
  langues: [String], // Un tableau de langues parlées
  description: String, // Une description du guide
});

module.exports = mongoose.model('Guide', guideSchema);