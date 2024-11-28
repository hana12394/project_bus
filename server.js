const express = require('express'); 
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const Route = require('./models/Route'); // Modèle de trajet
const Reservation = require('./models/Reservation'); // Modèle de réservation
const Admin = require('./models/Admin'); // Modèle de l'administrateur

const app = express();

// Connexion à la base de données MongoDB
mongoose.connect('mongodb://localhost:27017/bus-reservation', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error("MongoDB connection error: ", err);
        process.exit(1);
    });

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'votre_clé_secrète', // Changez cela par une clé sécurisée
    resave: false,
    saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Page d'accueil (formulaire de recherche)
app.get('/', (req, res) => {
    res.render('home');
});

// Recherche de trajets
app.post('/search', async (req, res) => {
    try {
        const { departure, destination, departureDate } = req.body;
        const routes = await Route.find({
            departure,
            destination,
            departureDate: { $gte: new Date(departureDate) }
        });
        res.render('results', { routes });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur lors de la recherche des trajets.");
    }
});

// Afficher le formulaire de login pour l'administrateur
app.get('/admin/login', (req, res) => {
    res.render('login');
});

// Gérer la soumission du formulaire de login
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await Admin.findOne({ username, password });
        if (admin) {
            req.session.admin = admin; // Stocker les informations de l'administrateur dans la session
            res.redirect('/admin'); // Rediriger vers la page admin
        } else {
            res.status(401).send("Nom d'utilisateur ou mot de passe incorrect.");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur lors de la connexion.");
    }
});

// Protéger l'accès à la page admin
app.get('/admin', async (req, res, next) => {
    if (req.session.admin) {
        next(); // Autoriser l'accès si l'administrateur est connecté
    } else {
        res.redirect('/admin/login'); // Rediriger vers la page de login
    }
}, async (req, res) => {
    try {
        const routes = await Route.find();
        const reservations = await Reservation.find().populate('routeId');

        const reservationsWithDates = reservations
        .filter(reservation => reservation.routeId)
        .map(reservation => {
            const route = reservation.routeId;
            return {
                ...reservation.toObject(),
                departureDate: route.departureDate,
                arrivalDate: route.arrivalDate,
                reservationDate: reservation._id.getTimestamp()
            };
        });

        res.render('admin', { routes, reservations: reservationsWithDates });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur lors de la récupération des données.");
    }
});

// Ajouter un trajet
app.post('/admin', async (req, res) => {
    try {
        const { departure, destination, price, departureDate, arrivalDate, availableSeats } = req.body;

        const route = new Route({
            departure,
            destination,
            price,
            departureDate: new Date(departureDate),
            arrivalDate: new Date(arrivalDate),
            availableSeats
        });

        await route.save();
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur lors de l'ajout du trajet.");
    }
});

// Réserver un trajet
app.post('/reserve/:routeId', async (req, res) => {
    try {
        const { routeId } = req.params;
        const { customerName, customerEmail, customerPhone, paymentCardNumber, paymentCardCVC, paymentCardHolderName } = req.body;

        const route = await Route.findById(routeId);
        if (!route) {
            return res.status(404).send("Trajet non trouvé.");
        }

        // Validation des dates de départ et d'arrivée
        if (!route.departureDate || !route.arrivalDate) {
            return res.status(400).send("Les dates de départ et d'arrivée sont obligatoires.");
        }

        if (route.availableSeats > 0) {
            const reservation = new Reservation({
                routeId,
                customerName,
                customerEmail,
                customerPhone,
                paymentCardNumber,
                paymentCardCVC,
                paymentCardHolderName,
                paymentAmount: route.price,
                reservationDate: new Date()
            });

            await reservation.save();

            route.availableSeats -= 1;
            await route.save();

            const ticketCode = Math.floor(Math.random() * 1000000);
            const departureTime = new Date(route.departureDate);
            const arrivalTime = new Date(route.arrivalDate);

            res.render('confirmation', { 
                customerName, 
                customerEmail, 
                customerPhone, 
                route, 
                paymentAmount: route.price,
                departureTime: departureTime,
                arrivalTime: arrivalTime,
                ticketCode,
            });
        } else {
            res.send("Désolé, il n'y a plus de places disponibles pour ce trajet.");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur lors de la réservation.");
    }
});

// Démarrer le serveur
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
