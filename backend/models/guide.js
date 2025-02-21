const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const availabilitySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  timeSlots: [{
    startTime: String,
    endTime: String,
    isBooked: {
      type: Boolean,
      default: false
    }
  }]
});

const guideSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  nom: { 
    type: String, 
    required: true 
  },
  prenom: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  profileImage: {
    type: String,
    default: 'default-guide.png'
  },
  specialites: {
    type: [String],
    required: true,
    validate: [arr => arr.length > 0, 'At least one specialty is required']
  },
  destinations: {
    type: [{
      city: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    }],
    required: true,
    validate: [arr => arr.length > 0, 'At least one destination is required']
  },
  langues: {
    type: [String],
    required: true,
    validate: [arr => arr.length > 0, 'At least one language is required']
  },
  description: {
    type: String,
    required: true,
    minlength: [100, 'Description must be at least 100 characters long']
  },
  experience: {
    years: {
      type: Number,
      required: true,
      min: 0
    },
    description: String
  },
  certifications: [{
    name: String,
    issuer: String,
    year: Number,
    description: String
  }],
  pricing: {
    baseRate: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'EUR'
    },
    perPerson: Boolean,
    customRates: [{
      service: String,
      rate: Number
    }]
  },
  availability: [availabilitySchema],
  reviews: [reviewSchema],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numberOfReviews: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate average rating when a review is added or modified
guideSchema.pre('save', function(next) {
  if (this.reviews.length > 0) {
    this.rating = this.reviews.reduce((acc, review) => acc + review.rating, 0) / this.reviews.length;
    this.numberOfReviews = this.reviews.length;
  }
  next();
});

// Virtual populate for upcoming tours
guideSchema.virtual('upcomingTours', {
  ref: 'Tour',
  foreignField: 'guide',
  localField: '_id'
});

module.exports = mongoose.model('Guide', guideSchema);