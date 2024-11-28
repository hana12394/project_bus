const mongoose = require('mongoose');

// Schéma de la réservation
const reservationSchema = new mongoose.Schema({
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',  // Référence au modèle de trajet
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    paymentCardNumber: {
        type: String,
        required: true
    },
    paymentCardCVC: {
        type: String,
        required: true
    },
    paymentCardHolderName: {
        type: String,
        required: true
    },
    paymentAmount: {
        type: Number,
        required: true
    },
    reservationDate: {
        type: Date,
        default: Date.now
    }
    
});

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;