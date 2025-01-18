const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
const port = 5500;

// Connexion à MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/travelbuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erreur de connexion à MongoDB :'));
db.once('open', function() {
  console.log('Connecté à MongoDB !');
});

// Configuration de la session
app.use(session({
  secret: 'Adf5ex12078dQSmpJa8AqXml',
  resave: false,
  saveUninitialized: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const User = require('./models/user');
const Guide = require('./models/guide');

// Route pour l'inscription
app.post('/inscription', async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.motdepasse, salt);

    const newUser = new User({
      nom: req.body.nom,
      prenom: req.body.prenom,
      email: req.body.email,
      motdepasse: hashedPassword
    });
    await newUser.save();

    req.session.user = newUser;

    res.redirect('/');
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur', error);
    res.status(500).send('Erreur lors de la création de l\'utilisateur');
  }
});

// Route pour la connexion
app.post('/connexion', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).send('Utilisateur non trouvé');
    }

    const match = await bcrypt.compare(req.body.motdepasse, user.motdepasse);
    if (!match) {
      return res.status(401).send('Mot de passe incorrect');
    }

    req.session.user = user;

    res.redirect('/');
  } catch (error) {
    console.error('Erreur lors de la connexion', error);
    res.status(500).send('Erreur lors de la connexion');
  }
});

// Route pour la déconnexion
app.get('/deconnexion', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erreur lors de la déconnexion', err);
      res.status(500).send('Erreur lors de la déconnexion');
    } else {
      res.redirect('/');
    }
  });
});

// Route pour ajouter un profil de guide
app.post('/ajouter-profil', async (req, res) => {
  try {
    const specialites = req.body.specialites ? req.body.specialites.split(',') : [];
    const destinations = req.body.destinations ? req.body.destinations.split(',') : [];
    const langues = req.body.langues ? req.body.langues.split(',') : [];

    const newGuide = new Guide({
      nom: req.body.nom,
      prenom: req.body.prenom,
      email: req.body.email,
      specialites: specialites,
      destinations: destinations,
      langues: langues,
      description: req.body.description
    });
    await newGuide.save();
    res.redirect('/');
  } catch (error) {
    console.error('Erreur lors de la création du profil de guide', error);
    res.status(500).send('Erreur lors de la création du profil de guide');
  }
});

app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});