const express = require('express');
const router = express.Router();
const Guide = require('../models/guide');

// Get all guides
router.get('/', async (req, res) => {
  try {
    const guides = await Guide.find().populate('user', 'nom prenom email');
    res.json(guides);
  } catch (error) {
    console.error('Error fetching guides:', error);
    res.status(500).json({ message: 'Error fetching guides' });
  }
});

// Get guide by ID
router.get('/:id', async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id).populate('user', 'nom prenom email');
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }
    res.json(guide);
  } catch (error) {
    console.error('Error fetching guide:', error);
    res.status(500).json({ message: 'Error fetching guide' });
  }
});

// Create new guide profile
router.post('/', async (req, res) => {
  try {
    const { ville, langues, description, tarif, disponibilites } = req.body;
    
    // Check if guide profile already exists for user
    const existingGuide = await Guide.findOne({ user: req.session.userId });
    if (existingGuide) {
      return res.status(400).json({ message: 'Guide profile already exists for this user' });
    }

    const guide = new Guide({
      user: req.session.userId,
      ville,
      langues,
      description,
      tarif,
      disponibilites
    });

    await guide.save();
    res.status(201).json(guide);
  } catch (error) {
    console.error('Error creating guide profile:', error);
    res.status(500).json({ message: 'Error creating guide profile' });
  }
});

// Update guide profile
router.put('/:id', async (req, res) => {
  try {
    const { ville, langues, description, tarif, disponibilites } = req.body;
    
    const guide = await Guide.findById(req.params.id);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    // Check if user owns this profile
    if (guide.user.toString() !== req.session.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    guide.ville = ville;
    guide.langues = langues;
    guide.description = description;
    guide.tarif = tarif;
    guide.disponibilites = disponibilites;

    await guide.save();
    res.json(guide);
  } catch (error) {
    console.error('Error updating guide profile:', error);
    res.status(500).json({ message: 'Error updating guide profile' });
  }
});

// Search guides
router.get('/search', async (req, res) => {
  try {
    const { ville, langue, disponibilite } = req.query;
    const query = {};

    if (ville) query.ville = new RegExp(ville, 'i');
    if (langue) query.langues = { $in: [new RegExp(langue, 'i')] };
    if (disponibilite) query.disponibilites = { $in: [disponibilite] };

    const guides = await Guide.find(query).populate('user', 'nom prenom email');
    res.json(guides);
  } catch (error) {
    console.error('Error searching guides:', error);
    res.status(500).json({ message: 'Error searching guides' });
  }
});

module.exports = router;
