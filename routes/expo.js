"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const router = express.Router();
const db = require('../config/db.ts'); // Connexion à la BDD
const { body, validationResult } = require('express-validator');
const authenticateJWT_1 = __importDefault(require("../middleware/authenticateJWT")); // Middleware pour l'authentification JWT
// Route pour ajouter une exposition
router.post('/create', authenticateJWT_1.default, // Middleware d'authentification
// Validation des données d'entrée
body('name').trim().notEmpty().withMessage('Le nom est requis'), body('isStartAt').isISO8601().toDate().withMessage('La date de début est invalide'), body('isFinishAt').isISO8601().toDate().withMessage('La date de fin est invalide'), body('description').trim().notEmpty().withMessage('La description est requise'), body('idPriceAdult').isInt().withMessage('idPriceAdult doit être un entier'), body('idPriceChild').isInt().withMessage('idPriceChild doit être un entier'), body('idAdmin').isInt().withMessage('idAdmin doit être un entier'), (req, res) => {
    // Validation des erreurs de la requête
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, isStartAt, isFinishAt, description, idPriceAdult, idPriceChild, idAdmin } = req.body;
    // Requête SQL pour ajouter l'exposition
    const sql = 'INSERT INTO exposition (name, isStartAt, isFinishAt, description, idPriceAdult, idPriceChild, idAdmin) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, isStartAt, isFinishAt, description, idPriceAdult, idPriceChild, idAdmin], (err, result) => {
        if (err) {
            return res.status(500).send({ message: 'Erreur lors de l\'ajout de l\'exposition', error: err });
        }
        res.status(201).send({ message: 'Exposition ajoutée avec succès', result });
    });
});
// Route pour modifier une exposition par ID
router.put('/edit/:idExposition', authenticateJWT_1.default, // Middleware d'authentification
body('name').trim().optional(), body('isStartAt').optional().isISO8601().toDate().withMessage('Date de début invalide'), body('isFinishAt').optional().isISO8601().toDate().withMessage('Date de fin invalide'), body('description').trim().optional(), body('idPriceAdult').optional().isInt().withMessage('idPriceAdult doit être un entier'), body('idPriceChild').optional().isInt().withMessage('idPriceChild doit être un entier'), body('idAdmin').optional().isInt().withMessage('idAdmin doit être un entier'), (req, res) => {
    // Validation des erreurs de la requête
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { idExposition } = req.params; // Récupération de l'idExposition depuis les paramètres de l'URL
    const { name, isStartAt, isFinishAt, description, idPriceAdult, idPriceChild, idAdmin } = req.body;
    // Requête SQL pour modifier l'exposition
    const sql = 'UPDATE exposition SET name = ?, isStartAt = ?, isFinishAt = ?, description = ?, idPriceAdult = ?, idPriceChild = ?, idAdmin = ? WHERE idExposition = ?';
    db.query(sql, [name, isStartAt, isFinishAt, description, idPriceAdult, idPriceChild, idAdmin, idExposition], (err, result) => {
        if (err) {
            return res.status(500).send({ message: 'Erreur lors de la mise à jour de l\'exposition', error: err });
        }
        res.status(200).send({ message: 'Exposition mise à jour avec succès', result });
    });
});
// Export du router
module.exports = router;
