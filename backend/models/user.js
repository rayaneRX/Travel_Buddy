const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Add this import

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motdepasse: { type: String, required: true }
});

// Hash the password before saving the user
userSchema.pre('save', async function(next) {
  if (this.isModified('motdepasse')) {
    this.motdepasse = await bcrypt.hash(this.motdepasse, 10);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);