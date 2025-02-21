const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  guide: {
    type: mongoose.Schema.ObjectId,
    ref: 'Guide',
    required: true
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  destination: {
    city: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  numberOfPeople: {
    type: Number,
    required: true,
    min: 1
  },
  totalPrice: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  specialRequests: String,
  itinerary: {
    meetingPoint: {
      description: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    activities: [{
      time: String,
      description: String,
      location: String
    }]
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  cancellationReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
tourSchema.index({ guide: 1, date: 1 });
tourSchema.index({ client: 1, date: 1 });
tourSchema.index({ status: 1 });

module.exports = mongoose.model('Tour', tourSchema);
