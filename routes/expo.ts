const express = require('express');
const router = express.Router();
import { Request, Response } from 'express';
const db = require('../config/db.ts'); // Connexion à la BDD
const { body, validationResult } = require('express-validator');
import authenticateJWT from '../middleware/authenticateJWT'; // Middleware pour l'authentification JWT

interface Exposition {
    idExposition: number;
    name: string;
    isStartAt: string;
    isFinishAt: string;
    description: string;
    idPriceAdult: string;
    idPriceChild: string;
    idAdmin: number;
    image:string;
    adultPrice:number;
    childPrice: number;
}

// Route pour ajouter une exposition
router.post(
    '/create',
    authenticateJWT, // Middleware d'authentification
    // Validation des données d'entrée
    body('name').trim().notEmpty().withMessage('Le nom est requis'),
    body('isStartAt').isISO8601().toDate().withMessage('La date de début est invalide'),
    body('isFinishAt').isISO8601().toDate().withMessage('La date de fin est invalide'),
    body('description').trim().notEmpty().withMessage('La description est requise'),
    body('idPriceAdult').isInt().withMessage('idPriceAdult doit être un entier'),
    body('idPriceChild').isInt().withMessage('idPriceChild doit être un entier'),
    body('idAdmin').isInt().withMessage('idAdmin doit être un entier'),
    (req: Request, res: Response) => {
        // Validation des erreurs de la requête
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, isStartAt, isFinishAt, description, idPriceAdult, idPriceChild, idAdmin } = req.body;

        // Requête SQL pour ajouter l'exposition
        const sql = 'INSERT INTO exposition (name, isStartAt, isFinishAt, description, idPriceAdult, idPriceChild, idAdmin) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.query(sql, [name, isStartAt, isFinishAt, description, idPriceAdult, idPriceChild, idAdmin], (err: Error, result: any) => {
            if (err) {
                return res.status(500).send({ message: 'Erreur lors de l\'ajout de l\'exposition', error: err });
            }
            res.status(201).send({ message: 'Exposition ajoutée avec succès', result });
        });
    }
);

// Route pour modifier une exposition par ID
router.put(
    '/edit/:idExposition',
    authenticateJWT, // Middleware d'authentification
    body('name').trim().optional(),
    body('isStartAt').optional().isISO8601().toDate().withMessage('Date de début invalide'),
    body('isFinishAt').optional().isISO8601().toDate().withMessage('Date de fin invalide'),
    body('description').trim().optional(),
    body('idPriceAdult').optional().isInt().withMessage('idPriceAdult doit être un entier'),
    body('idPriceChild').optional().isInt().withMessage('idPriceChild doit être un entier'),
    body('idAdmin').optional().isInt().withMessage('idAdmin doit être un entier'),
    (req: Request, res: Response) => {
        // Validation des erreurs de la requête
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { idExposition } = req.params; // Récupération de l'idExposition depuis les paramètres de l'URL
        const { name, isStartAt, isFinishAt, description, idPriceAdult, idPriceChild, idAdmin } = req.body;

        // Requête SQL pour modifier l'exposition
        const sql = 'UPDATE exposition SET name = ?, isStartAt = ?, isFinishAt = ?, description = ?, idPriceAdult = ?, idPriceChild = ?, idAdmin = ? WHERE idExposition = ?';
        db.query(sql, [name, isStartAt, isFinishAt, description, idPriceAdult, idPriceChild, idAdmin, idExposition], (err: Error, result: any) => {
            if (err) {
                return res.status(500).send({ message: 'Erreur lors de la mise à jour de l\'exposition', error: err });
            }
            res.status(200).send({ message: 'Exposition mise à jour avec succès', result });
        });
    }
);



router.post(
    '/listing',
    body('isFinishAt').isInt().escape(),
    (req: Request, res: Response) => {
        try{
            // Validation des erreurs de la requête
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(500).json({ errors: errors.array() });
            }
            const { isFinishAt } = req.body;
            const sql =`
    SELECT 
        e.*, 
        pAdult.price AS adultPrice, 
        pChild.price AS childPrice 
    FROM 
        exposition e 
    INNER JOIN 
        price pAdult ON e.idPriceAdult = pAdult.idPrice 
    INNER JOIN 
        price pChild ON e.idPriceChild = pChild.idPrice
`;
            
            
            db.query(sql, [], (err: Error, result: any) => {
                if (err) {
                    return res.status(500).send({ message: 'Erreur lors de l\'ajout de l\'exposition', error: err });
                }
                const dateActuelle = new Date(); // Date actuelle
                let filteredResult;
                result.map((elem:Exposition)=>{
                    if(isFinishAt ==1){
                        filteredResult = result.filter((elem: Exposition) => new Date(elem.isFinishAt) > dateActuelle);
                    }else if(isFinishAt ==2) { 
                        filteredResult = result.filter((elem: Exposition) => new Date(elem.isFinishAt)<dateActuelle);
                    }else{
                        res.status(500).send({"message":"Error in the id ."});
                    }
                })
                res.status(200).send(filteredResult );
            });
        }catch(error){
            res.status(500).send({"message":error});
            
        }
        //res.status(500).send({"message":"erreur dans id"});
    }
);



router.post(
    '/detail',
    body('idExposition').isInt().escape(),
    (req: Request, res: Response) => {
        try{
            // Validation des erreurs de la requête
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(500).json({ errors: errors.array() });
            }
            const { idExposition } = req.body;
            const sql =`
    SELECT 
        e.*, 
        pAdult.price AS adultPrice, 
        pChild.price AS childPrice 
    FROM 
        exposition e 
    INNER JOIN 
        price pAdult ON e.idPriceAdult = pAdult.idPrice 
    INNER JOIN 
        price pChild ON e.idPriceChild = pChild.idPrice
    WHERE e.idExposition = ?
`;
            
            
            db.query(sql, [idExposition], (err: Error, result: any) => {
                if (err) {
                    return res.status(500).send({ message: 'Erreur lors de l\'ajout de l\'exposition', error: err });
                }
                if(result.length==0){
                    return res.status(404).send({"message": "expsotion non connu"} );
                }
                const expositions = result.map((elem: Exposition) => ({
                    idExposition: elem.idExposition,
                    name: elem.name,
                    isStartAt: elem.isStartAt,
                    isFinishAt: elem.isFinishAt,
                    description: elem.description,
                    idPriceAdult: elem.idPriceAdult,
                    idPriceChild: elem.idPriceChild,
                    idAdmin: elem.idAdmin,
                    image: elem.image,
                    adultPrice: elem.adultPrice,
                    childPrice: elem.childPrice,
                }));
                
                res.status(200).send(expositions);
            });
        }catch(error){
            res.status(500).send({"message":error});
            
        }
        //res.status(500).send({"message":"erreur dans id"});
    }
);
// Export du router
module.exports = router;
