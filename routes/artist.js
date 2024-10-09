"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const router = express.Router();
const db = require('../config/db.ts'); // Connexion à la BDD
const { body, validationResult } = require('express-validator');
const authenticateJWT_1 = __importDefault(require("../middleware/authenticateJWT")); // Import middleware for JWT authentication
const multer = require('multer');
const fs = require("fs");
const { unlink } = require('node:fs');
// Route for adding an artist
router.post('/create', authenticateJWT_1.default, // Apply middleware here
// Validation of input data
body('name').trim().notEmpty().withMessage('Name is required'), body('description').trim().notEmpty().withMessage('Description is required'), body('birthDay').isISO8601().toDate().withMessage('Invalid birthDay format'), body('idCountry').isInt().withMessage('Invalid idCountry'), (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, description, birthDay, idCountry } = req.body;
    const sql = 'INSERT INTO artist (name, description, birthDay, idCountry) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, description, birthDay, idCountry], (err, result) => {
        if (err) {
            return res.status(500).send({ message: 'Mauvais format', error: err });
        }
        res.status(201).send({ message: 'Artiste correctement ajouter', result });
    });
});
// Route for modifying an artist by ID
router.put('/edit', authenticateJWT_1.default, // Appliquer le middleware ici
body('description').trim().optional(), body('name').trim().optional(), body('birthDay').optional().isISO8601().toDate().withMessage('Le format de la date de naissance est invalide'), body('idCountry').optional().isInt().withMessage('idCountry doit être un entier valide'), body('idArtist').isInt().withMessage('idArtist est obligatoire et doit être un entier'), // Validation de idArtist dans le corps de la requête
(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { description, birthDay, idCountry, name, idArtist } = req.body; // Récupérer idArtist depuis le corps de la requête
    // Ordre correct des paramètres
    const sql = 'UPDATE artist SET description = ?, name = ?, birthDay = ?, idCountry = ? WHERE idArtist = ?';
    db.query(sql, [description, name, birthDay, idCountry, idArtist], (err, result) => {
        if (err) {
            return res.status(500).send({ message: 'Erreur lors de la mise à jour de l\'artiste', error: err });
        }
        res.status(200).send({ message: 'Artiste mis à jour avec succès !', result });
    });
});
// Route for disabling an artist by ID
router.put('/disable', // Route for disabling an artist (without ID in the URL)
authenticateJWT_1.default, // Apply middleware here
body('idArtist').isInt().withMessage('idArtist doit être un entier'), // Validate idArtist in the request body
(req, res) => {
    // Validate request errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { idArtist } = req.body; // Get idArtist from the request body (JSON)
    // SQL query to set isAvailable to FALSE
    const sql = 'UPDATE artist SET isAvailable = FALSE WHERE idArtist = ?';
    db.query(sql, [idArtist], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la désactivation de l\'artiste', error: err });
        }
        // Check if any rows were affected (i.e., if the artist exists)
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Artiste non trouvé' });
        }
        // Send success response
        res.status(200).json({ message: 'Artiste désactivé avec succès' });
    });
});
// Route for enabling an artist (without ID in the URL)
router.put('/enable', authenticateJWT_1.default, // Apply middleware here
body('idArtist').isInt().withMessage('idArtist doit être un entier'), // Validate idArtist in the request body
(req, res) => {
    // Validate request errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { idArtist } = req.body; // Get idArtist from the request body (JSON)
    // SQL query to set isAvailable to TRUE
    const sql = 'UPDATE artist SET isAvailable = TRUE WHERE idArtist = ?';
    db.query(sql, [idArtist], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de l\'activation de l\'artiste', error: err });
        }
        // Check if any rows were affected (i.e., if the artist exists)
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Artiste non trouvé' });
        }
        // Send success response
        res.status(200).json({ message: 'Artiste activé avec succès' });
    });
});
// Export the router
module.exports = router;
