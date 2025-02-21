const express = require('express');
const router = express.Router();
const Tour = require('../models/tour');
const Guide = require('../models/guide');

// Book a tour
router.post('/', async (req, res) => {
  try {
    const {
      guideId,
      date,
      startTime,
      endTime,
      numberOfPeople,
      specialRequests,
      itinerary
    } = req.body;

    // Find guide
    const guide = await Guide.findById(guideId);
    if (!guide) {
      return res.status(404).json({ message: 'Guide non trouvé' });
    }

    // Check guide availability
    const tourDate = new Date(date);
    const availability = guide.availability.find(
      a => a.date.toDateString() === tourDate.toDateString()
    );

    if (!availability || !availability.isAvailable) {
      return res.status(400).json({ 
        message: 'Le guide n\'est pas disponible à cette date' 
      });
    }

    // Check time slot availability
    const timeSlot = availability.timeSlots.find(
      slot => slot.startTime === startTime && slot.endTime === endTime
    );

    if (!timeSlot || timeSlot.isBooked) {
      return res.status(400).json({ 
        message: 'Ce créneau horaire n\'est pas disponible' 
      });
    }

    // Calculate total price
    const baseRate = guide.pricing.baseRate;
    const totalPrice = guide.pricing.perPerson 
      ? baseRate * numberOfPeople 
      : baseRate;

    // Create tour booking
    const tour = new Tour({
      guide: guideId,
      client: req.user.id,
      destination: {
        city: itinerary.meetingPoint.city,
        country: itinerary.meetingPoint.country,
        coordinates: itinerary.meetingPoint.coordinates
      },
      date,
      startTime,
      endTime,
      numberOfPeople,
      totalPrice,
      currency: guide.pricing.currency,
      specialRequests,
      itinerary
    });

    await tour.save();

    // Update guide availability
    timeSlot.isBooked = true;
    await guide.save();

    res.status(201).json({
      message: 'Réservation créée avec succès',
      tour
    });
  } catch (error) {
    console.error('Erreur création tour:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la réservation' });
  }
});

// Get user's tours
router.get('/my-tours', async (req, res) => {
  try {
    const tours = await Tour.find({ client: req.user.id })
      .populate('guide', 'nom prenom email profileImage rating')
      .sort({ date: 1 });

    res.json({ tours });
  } catch (error) {
    console.error('Erreur récupération tours:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des réservations' });
  }
});

// Get guide's tours
router.get('/guide-tours', async (req, res) => {
  try {
    const guide = await Guide.findOne({ userId: req.user.id });
    if (!guide) {
      return res.status(404).json({ message: 'Guide non trouvé' });
    }

    const tours = await Tour.find({ guide: guide._id })
      .populate('client', 'nom prenom email profileImage')
      .sort({ date: 1 });

    res.json({ tours });
  } catch (error) {
    console.error('Erreur récupération tours:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des réservations' });
  }
});

// Get tour details
router.get('/:id', async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id)
      .populate('guide', 'nom prenom email profileImage rating')
      .populate('client', 'nom prenom email profileImage');

    if (!tour) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Check if user is authorized to view this tour
    if (tour.client._id.toString() !== req.user.id && 
        tour.guide.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    res.json({ tour });
  } catch (error) {
    console.error('Erreur récupération tour:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la réservation' });
  }
});

// Update tour status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Check if user is the guide
    const guide = await Guide.findOne({ userId: req.user.id });
    if (!guide || guide._id.toString() !== tour.guide.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    tour.status = status;
    await tour.save();

    res.json({
      message: 'Statut de la réservation mis à jour avec succès',
      tour
    });
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut' });
  }
});

// Cancel tour
router.put('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Check if user is authorized to cancel
    if (tour.client.toString() !== req.user.id && 
        tour.guide.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Check if tour can be cancelled
    if (tour.status === 'completed' || tour.status === 'cancelled') {
      return res.status(400).json({ 
        message: 'Cette réservation ne peut pas être annulée' 
      });
    }

    tour.status = 'cancelled';
    tour.cancellationReason = reason;
    await tour.save();

    // Update guide availability
    const guide = await Guide.findById(tour.guide);
    const availability = guide.availability.find(
      a => a.date.toDateString() === tour.date.toDateString()
    );

    if (availability) {
      const timeSlot = availability.timeSlots.find(
        slot => slot.startTime === tour.startTime && slot.endTime === tour.endTime
      );
      if (timeSlot) {
        timeSlot.isBooked = false;
        await guide.save();
      }
    }

    res.json({
      message: 'Réservation annulée avec succès',
      tour
    });
  } catch (error) {
    console.error('Erreur annulation tour:', error);
    res.status(500).json({ message: 'Erreur lors de l\'annulation de la réservation' });
  }
});

module.exports = router;
