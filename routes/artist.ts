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



// Route for adding an artist
router.post(
    '/create',
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
router.put('/edit', 
    authenticateJWT, // Appliquer le middleware ici
    body('description').trim().optional(),
    body('name').trim().optional(),
    body('birthDay').optional().isISO8601().toDate().withMessage('Le format de la date de naissance est invalide'),
    body('idCountry').optional().isInt().withMessage('idCountry doit être un entier valide'),
    body('idArtist').isInt().withMessage('idArtist est obligatoire et doit être un entier'), // Validation de idArtist dans le corps de la requête
    (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { description, birthDay, idCountry, name, idArtist } = req.body; // Récupérer idArtist depuis le corps de la requête

        // Ordre correct des paramètres
        const sql = 'UPDATE artist SET description = ?, name = ?, birthDay = ?, idCountry = ? WHERE idArtist = ?';
        db.query(sql, [description, name, birthDay, idCountry, idArtist], (err: Error, result: any) => {
            if (err) {
                return res.status(500).send({ message: 'Erreur lors de la mise à jour de l\'artiste', error: err });
            }
            res.status(200).send({ message: 'Artiste mis à jour avec succès !', result });
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
router.get(
    '/listing-for-selectInput', 
        (req: Request, res: Response) => {
 
        const sql = 'SELECT * FROM artist ;';
        type Artist = {
            value:number;
            label:string ;
        }
        db.query(sql, (err: Error | null, result: any) => {
            if (err) {
                return res.status(500).json({ message: 'Aucun artiste trouvé.', error: err });
            }
            let artistes  :Artist[]= [];
            for(let i =0; i < result.length;i++){
                artistes.push({ 'value': result[i].idArtist, 'label': result[i].name})
            }
            return res.status(200).json(artistes);
        });
    }
);


router.get(
    '/listing', 
        (req: Request, res: Response) => {
 
        const sql = 'SELECT *,a.image AS imageArtiste, a.name AS nameArtist,  c.name AS country FROM artist a INNER JOIN country c ON a.idCountry = c.idCountry ;';
        interface Artist  {
            idArtist: number; // Ajout d'un ID pour la clé unique
            nameArtist: string;
            birthDay: string;
            country: string;
            description:string;
            image:string;
          }
        db.query(sql, (err: Error | null, result: any) => {
            if (err) {
                return res.status(500).json({ message: 'Aucun artiste trouvé.', error: err });
            }
            let artistes  :Artist[]= [];
            for(let i =0; i < result.length;i++){
                artistes.push({
                    'idArtist': result[i].idArtist,
                    'nameArtist':result[i].nameArtist,
                    'birthDay': result[i].birthDay,
                    'country': result[i].country,
                    'description' :result[i].description,
                    'image':result[i].imageArtiste
                })
            }
            return res.status(200).json(artistes);
        });
    }
);

router.post(
    '/detail',
    body('idArtist').isInt().withMessage('Invalid idArtist'),
    (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { idArtist } = req.body;
        let oeuvres: Oeuvres[] = [];
        
        interface Pictures {
            idPictures: number;
            pictures: string;
            idWorks: number;
        }

        interface Oeuvres {
            description: string;
            pictures: Pictures[];
            artiste: string;
            image: string ;
        }

        // Requête pour récupérer les œuvres de l'artiste
        const sql = 'SELECT * , a.name AS nameartiste, a.description AS descriptionArtist FROM artist a INNER JOIN works w ON a.idArtist = w.idArtist  WHERE a.idArtist = ?';
        db.query(sql, [idArtist], (err: Error, re: any) => {
            if (err) {
                return res.status(500).send({ message: 'Erreur lors de la récupération des œuvres', error: err });
            }
            // Vérifier si une œuvre existe pour cet artiste
            if (re.length === 0) {
                return res.status(500).send({ message: 'Aucune œuvre trouvée pour cet artiste.' });
            }

            // Requête pour récupérer les images liées à l'œuvre
            const sqlPictures = 'SELECT * FROM pictures WHERE idWorks = ?';
            db.query(sqlPictures, [re[0].idWorks], (err: Error, r: any) => {
                if (err) {
                    return res.status(500).send({ message: 'Erreur lors de la récupération des images', error: err });
                }

                // Construction des objets Pictures
                let pictures: Pictures[] = r.map((pic: any) => ({
                    idPictures: pic.idPictures,
                    pictures: pic.pictures,
                    idWorks: pic.idWorks
                }));

                // Ajout de l'œuvre avec les images récupérées
                oeuvres.push({
                    artiste: re[0].nameartiste, // Vérifie que ce champ est bien présent
                    description: re[0].descriptionArtist,
                    pictures: pictures,
                    image: re[0].image
                });

                res.status(200).send(oeuvres);
            });
        });
    }
);



// Export the router
module.exports = router;
