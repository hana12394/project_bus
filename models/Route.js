const mongoose = require('mongoose');

// Définition du schéma pour les trajets
const routeSchema = new mongoose.Schema({
    departure: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    departureDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (v) {
                // Vérification que la date est valide (parsing + comparaison)
                return !isNaN(Date.parse(v));
            },
            message: 'La date de départ est invalide'
        }
    },
    arrivalDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (v) {
                return !isNaN(Date.parse(v));
            },
            message: 'La date d\'arrivée est invalide'
        }
    },
    availableSeats: {
        type: Number,
        required: true,
        min: 0
    },
    price: {
        type: Number,
        required: true
    }
});

// Création du modèle basé sur le schéma
const Route = mongoose.model('Route', routeSchema);

module.exports = Route;
