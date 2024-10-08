const express = require('express');
const router = express.Router();
import { Request, Response } from 'express';
const db = require('../config/db.ts'); // Connexion à la BDD
const { body, validationResult } = require('express-validator');
import authenticateJWT from '../middleware/authenticateJWT'; // Import middleware for JWT authentication
const multer = require('multer');
const fs = require("fs");
const { unlink } = require('node:fs');

interface Artist {
    id: number;
    name: string;
    description: string;
    birthDay: string;
    idCountry: number;
}

interface CustomRequest extends Request {
    newFileName?: string[]; 
}

// Setup for file uploads
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        const path = `./uploads`;
        fs.mkdirSync(path, { recursive: true });  
        return cb(null, path);
    },
    filename: async (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const customReq = req as CustomRequest;
        const namePicture = file.originalname;
        const splitNamePicture = namePicture.split('.');
        const typeName = splitNamePicture.pop(); 
        const originalName = splitNamePicture.join('.');

        // Create a unique filename
        let newFileName = `${originalName}-${uniqueSuffix}.${typeName}`;
        
        // Check if the filename already exists in the database
        let fileExists = await checkIfFileExistsInDB(newFileName);
        while (fileExists) {
            const newUniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            newFileName = `${originalName}-${newUniqueSuffix}.${typeName}`;
            fileExists = await checkIfFileExistsInDB(newFileName);
        }
        
        if (!customReq.newFileName) {
            customReq.newFileName = [];
        }
        customReq.newFileName.push(newFileName);
        cb(null, newFileName);
    }
});

async function checkIfFileExistsInDB(filename: string): Promise<boolean> {
    const sql = 'SELECT pictures FROM pictures WHERE pictures = ?';
    const [results] = await db.promise().query(sql, [filename]);
    return results.length > 0;
}

const upload = multer({ storage: storage });

// Route for adding an artist
router.post(
    '/add',
    authenticateJWT, // Apply middleware here
    // Validation of input data
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('birthDay').isISO8601().toDate().withMessage('Invalid birthDay format'),
    body('idCountry').isInt().withMessage('Invalid idCountry'),
    (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, birthDay, idCountry } = req.body;

        const sql = 'INSERT INTO artist (name, description, birthDay, idCountry) VALUES (?, ?, ?, ?)';
        db.query(sql, [name, description, birthDay, idCountry], (err: Error, result: any) => {
            if (err) {
                return res.status(500).send({ message: 'Mauvais format', error: err });
            }
            res.status(201).send({ message: 'Artiste correctement ajouter', result });
        });
    }
);

// Route for modifying an artist by ID
router.put('/edit/:idArtist', 
    authenticateJWT, // Apply middleware here
    body('description').trim().optional(),
    body('name').trim().optional(),
    body('birthDay').optional().isISO8601().toDate().withMessage('Invalid birthDay format'),
    body('idCountry').optional().isInt().withMessage('Invalid idCountry'),
    (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { idArtist } = req.params;  // Retrieve idArtist from URL parameters
        const { description, birthDay, idCountry, name } = req.body;

        // Correct the order of parameters
        const sql = 'UPDATE artist SET description = ?, name = ?, birthDay = ?, idCountry = ? WHERE idArtist = ?';
        db.query(sql, [description, name, birthDay, idCountry, idArtist], (err: Error, result: any) => {
            if (err) {
                return res.status(500).send({ message: 'Error updating artist', error: err });
            }
            res.status(200).send({ message: 'Artist mise à jour !', result });
        });
    }
);

// Route for disabling an artist by ID
router.put(
    '/disable', // Route for disabling an artist (without ID in the URL)
    authenticateJWT, // Apply middleware here
    body('idArtist').isInt().withMessage('idArtist doit être un entier'), // Validate idArtist in the request body
    (req: Request, res: Response) => {
        // Validate request errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { idArtist } = req.body; // Get idArtist from the request body (JSON)

        // SQL query to set isAvailable to FALSE
        const sql = 'UPDATE artist SET isAvailable = FALSE WHERE idArtist = ?';
        
        db.query(sql, [idArtist], (err: Error | null, result: any) => {
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
    }
);

// Route for enabling an artist (without ID in the URL)
router.put(
    '/enable', 
    authenticateJWT, // Apply middleware here
    body('idArtist').isInt().withMessage('idArtist doit être un entier'), // Validate idArtist in the request body
    (req: Request, res: Response) => {
        // Validate request errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { idArtist } = req.body; // Get idArtist from the request body (JSON)

        // SQL query to set isAvailable to TRUE
        const sql = 'UPDATE artist SET isAvailable = TRUE WHERE idArtist = ?';
        
        db.query(sql, [idArtist], (err: Error | null, result: any) => {
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
    }
);

// Export the router
module.exports = router;
