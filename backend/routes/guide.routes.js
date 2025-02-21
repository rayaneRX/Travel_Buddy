const express = require('express');
const router = express.Router();
const Guide = require('../models/guide');
const User = require('../models/user');

// Create guide profile
router.post('/', async (req, res) => {
  try {
    const {
      specialites,
      destinations,
      langues,
      description,
      experience,
      certifications,
      pricing
    } = req.body;

    // Check if user already has a guide profile
    const existingGuide = await Guide.findOne({ userId: req.user.id });
    if (existingGuide) {
      return res.status(400).json({ 
        message: 'Vous avez déjà un profil de guide' 
      });
    }

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Create guide profile
    const guide = new Guide({
      userId: req.user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      specialites,
      destinations,
      langues,
      description,
      experience,
      certifications,
      pricing
    });

    await guide.save();

    res.status(201).json({
      message: 'Profil de guide créé avec succès',
      guide
    });
  } catch (error) {
    console.error('Erreur création guide:', error);
    res.status(500).json({ message: 'Erreur lors de la création du profil de guide' });
  }
});

// Update guide profile
router.put('/', async (req, res) => {
  try {
    const guide = await Guide.findOne({ userId: req.user.id });
    if (!guide) {
      return res.status(404).json({ message: 'Profil de guide non trouvé' });
    }

    // Update fields
    const updateFields = [
      'specialites',
      'destinations',
      'langues',
      'description',
      'experience',
      'certifications',
      'pricing',
      'availability'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        guide[field] = req.body[field];
      }
    });

    await guide.save();

    res.json({
      message: 'Profil de guide mis à jour avec succès',
      guide
    });
  } catch (error) {
    console.error('Erreur mise à jour guide:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil de guide' });
  }
});

// Get guide profile
router.get('/profile', async (req, res) => {
  try {
    const guide = await Guide.findOne({ userId: req.user.id });
    if (!guide) {
      return res.status(404).json({ message: 'Profil de guide non trouvé' });
    }

    res.json({ guide });
  } catch (error) {
    console.error('Erreur récupération guide:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du profil de guide' });
  }
});

// Search guides by location and filters
router.get('/search', async (req, res) => {
  try {
    const {
      city,
      country,
      specialites,
      langues,
      maxPrice,
      minRating,
      dateDebut,
      dateFin
    } = req.query;

    // Build query
    const query = { status: 'active' };

    // Location filter
    if (city || country) {
      query.destinations = {
        $elemMatch: {}
      };
      if (city) query.destinations.$elemMatch.city = new RegExp(city, 'i');
      if (country) query.destinations.$elemMatch.country = new RegExp(country, 'i');
    }

    // Specialties filter
    if (specialites) {
      const specialitesArray = specialites.split(',');
      query.specialites = { $in: specialitesArray };
    }

    // Languages filter
    if (langues) {
      const languesArray = langues.split(',');
      query.langues = { $in: languesArray };
    }

    // Price filter
    if (maxPrice) {
      query['pricing.baseRate'] = { $lte: parseFloat(maxPrice) };
    }

    // Rating filter
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    // Availability filter
    if (dateDebut && dateFin) {
      query.availability = {
        $elemMatch: {
          date: {
            $gte: new Date(dateDebut),
            $lte: new Date(dateFin)
          },
          isAvailable: true
        }
      };
    }

    // Execute query with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const guides = await Guide.find(query)
      .sort({ rating: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Guide.countDocuments(query);

    res.json({
      guides,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Erreur recherche guides:', error);
    res.status(500).json({ message: 'Erreur lors de la recherche des guides' });
  }
});

// Get guide details by ID
router.get('/:id', async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id)
      .populate('reviews.user', 'nom prenom profileImage');
    
    if (!guide) {
      return res.status(404).json({ message: 'Guide non trouvé' });
    }

    res.json({ guide });
  } catch (error) {
    console.error('Erreur récupération guide:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du guide' });
  }
});

// Add review
router.post('/:id/reviews', async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const guide = await Guide.findById(req.params.id);
    
    if (!guide) {
      return res.status(404).json({ message: 'Guide non trouvé' });
    }

    // Check if user has already reviewed this guide
    const existingReview = guide.reviews.find(
      review => review.user.toString() === req.user.id
    );

    if (existingReview) {
      return res.status(400).json({ 
        message: 'Vous avez déjà donné votre avis sur ce guide' 
      });
    }

    guide.reviews.push({
      user: req.user.id,
      rating,
      comment
    });

    await guide.save();

    res.status(201).json({
      message: 'Avis ajouté avec succès',
      guide
    });
  } catch (error) {
    console.error('Erreur ajout avis:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'avis' });
  }
});

// Update availability
router.put('/availability', async (req, res) => {
  try {
    const { availability } = req.body;
    const guide = await Guide.findOne({ userId: req.user.id });
    
    if (!guide) {
      return res.status(404).json({ message: 'Guide non trouvé' });
    }

    guide.availability = availability;
    await guide.save();

    res.json({
      message: 'Disponibilités mises à jour avec succès',
      guide
    });
  } catch (error) {
    console.error('Erreur mise à jour disponibilités:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour des disponibilités' });
  }
});

module.exports = router;
