const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const passport = require('passport');

// Registration route
router.post('/inscription', async (req, res) => {
  try {
    const { nom, prenom, email, motdepasse } = req.body;
    const user = new User({ nom, prenom, email, motdepasse });
    await user.save();
    res.status(201).send('Utilisateur créé avec succès !');
  } catch (error) {
    res.status(400).send('Erreur lors de l\'inscription');
  }
});

// Login route
router.post('/connexion', passport.authenticate('local'), (req, res) => {
  res.send('Connexion réussie !');
});

// Logout route
router.post('/logout', (req, res) => {
  req.logout();
  res.send('Déconnexion réussie !');
});

module.exports = router;
