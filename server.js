const express = require('express'); // Assurez-vous que cette ligne est présente
const bodyParser = require('body-parser');
const cors = require('cors'); 
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const appServer = express(); // Utilisez express() ici pour initialiser votre serveur

// Middleware pour servir les fichiers statiques (images, etc.)
appServer.use('/uploads', express.static('uploads')); // Correction ici

// Configuration CORS
appServer.use(cors({
    origin: 'http://localhost:3000'
}));

// Body Parser
appServer.use(bodyParser.json());
appServer.use(express.urlencoded({ extended: true }));

// Swagger configuration
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.1.0',
        info: {
            title: 'API QUIZZ',
            version: '0.0.1',
            description: 'Je suis une super API',
            contact: {
                name: 'tino'
            },
            servers: [{ url: 'http://localhost:8889' }]
        }
    },
    apis: ['./routes/*.js'] // Changez ce chemin si nécessaire
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
// Initialisation de Swagger
appServer.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Démarrage de la connexion à la base de données
const dbServer = require('./config/db.ts');
dbServer.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('bravo !!');
    }
});

// Routes
const userRoutes = require('./routes/users.ts');
appServer.use('/api/users', userRoutes);

const oeuvresRoutes = require('./routes/oeuvres.ts');
appServer.use('/api/oeuvres', oeuvresRoutes);

const artistRoutes = require('./routes/artist.ts');
appServer.use('/api/artist', artistRoutes);

const expoRoutes = require('./routes/expo.ts');
appServer.use('/api/expo', expoRoutes);

// Démarrage du serveur
const port = process.env.PORT || 5050;
appServer.listen(port, () => {
    console.log(`SERVER DEMMARRE: ${port}`);
});
