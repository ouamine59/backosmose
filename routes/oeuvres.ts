const expressOeuvres = require('express');
const routerOeuvres = expressOeuvres.Router();
import { Request, Response } from 'express';
import authenticateJWT from '../middleware/authenticateJWT';
import { unlink } from 'node:fs';
const dbOeuvres = require('../config/db.ts');
const { query, validationResult, check, body } = require('express-validator');

const fs = require("fs");
const multer = require('multer');

interface CustomRequest extends Request {
    newFileName?: string[];
}

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
        const originalName = splitNamePicture.join('.'); // name without extension

        // Create a unique filename
        let newFileName = `${originalName}-${uniqueSuffix}.${typeName}`;

        // Check in the database if the name already exists
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
    const [results] = await dbOeuvres.promise().query(sql, [filename]);
    return results.length > 0;
}

const upload = multer({ storage: storage });

interface Oeuvres {
    id: number;
    name: string;
    idArtist: number;
    description: string;
    pictures: string[];
}

interface InsertResult {
    insertId: number;
    affectedRows: number;
    warningStatus: number;
}

class Oeuvres {
    constructor(name: string, idArtist: number, description: string, pictures: string[]) {
        this.name = name;
        this.idArtist = idArtist;
        this.description = description;
        this.pictures = pictures;
    }

    async create(res: Response) {
        const sql = "INSERT INTO works(name, idArtist, description) VALUES (?, ?, ?)";
        return new Promise<void>((resolve, reject) => {
            dbOeuvres.query(sql, [this.name, this.idArtist, this.description], async (err: Error | null, results: InsertResult) => {
                if (err) {
                    return reject(res.status(500).send({ message: 'Erreur lors de l\'insertion de l\'oeuvre', error: err }));
                }
                const workId = results.insertId;

                // Insert each picture associated with the work
                const sqlPicture: string = "INSERT INTO pictures(pictures, idWorks) VALUES (?, ?)";
                try {
                    for (let picture of this.pictures) {
                        await new Promise<void>((resolve, reject) => {
                            dbOeuvres.query(sqlPicture, [picture, workId], (err: Error | null) => {
                                if (err) {
                                    return reject(res.status(500).send({ message: 'Erreur lors de l\'insertion de l\'image', error: err }));
                                }
                                resolve();
                            });
                        });
                    }
                    res.status(201).send({ message: "Oeuvre créée avec succès." });
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }
}

routerOeuvres.post('/create',
    authenticateJWT,
    upload.fields([{ name: 'image', maxCount: 8 }]),
    body('name').trim().notEmpty().escape(),
    body('idArtist').isInt().escape(),
    body('description').trim().notEmpty().escape(),
    
    async (req: Request, res: Response) => {
        const customReq = req as CustomRequest;
        const { name, idArtist, description } = req.body;

        const result = validationResult(req);
        if (result.isEmpty()) {
            let pictureNames: string[] = [];
            if (customReq.newFileName) {
                pictureNames = customReq.newFileName;
            }
            const oeuvre = new Oeuvres(name, idArtist, description, pictureNames);
            await oeuvre.create(res);
        } else {
            res.status(400).send({ errors: result.array() });
        }
    }
);

routerOeuvres.put('/edit', 
    authenticateJWT, // Middleware d'authentification
    upload.fields([{ name: 'image', maxCount: 8 }]), // Middleware Multer pour traiter les fichiers
    body('idWorks').isInt().withMessage('L\'ID de l\'œuvre est obligatoire et doit être un entier'), // Validation de l'ID de l'œuvre
    body('name').trim().optional(),
    body('description').trim().optional(),
    body('idArtist').isInt().optional().withMessage('idArtist doit être un entier valide'), // Validation de idArtist dans le corps de la requête
    body('isAvailable').isBoolean().optional().withMessage('isAvailable doit être un booléen'), // Validation de isAvailable
    body('isFeatured').isBoolean().optional().withMessage('isFeatured doit être un booléen'), // Validation de isFeatured
    async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { idWorks, name, description, idArtist, isAvailable, isFeatured } = req.body; // Récupérer les valeurs depuis le corps de la requête
        const customReq = req as CustomRequest;

        // Construction des champs à mettre à jour dynamiquement
        let updateFields = '';
        const values: any[] = [];

        if (name !== undefined) {
            updateFields += 'name = ?, ';
            values.push(name);
        }
        if (description !== undefined) {
            updateFields += 'description = ?, ';
            values.push(description);
        }
        if (idArtist !== undefined) {
            updateFields += 'idArtist = ?, ';
            values.push(idArtist);
        }
        if (isAvailable !== undefined) {
            updateFields += 'isAvailable = ?, ';
            values.push(isAvailable);
        }
        if (isFeatured !== undefined) {
            updateFields += 'isFeatured = ?, ';
            values.push(isFeatured);
        }

        // Retirer la dernière virgule
        if (updateFields.endsWith(', ')) {
            updateFields = updateFields.slice(0, -2);
        }

        // Vérifier si des champs à mettre à jour ont été fournis
        if (!updateFields) {
            return res.status(400).send({ message: 'Aucun champ à mettre à jour' });
        }

        // Mise à jour de l'œuvre dans la table 'works'
        const sqlUpdateWork = `UPDATE works SET ${updateFields} WHERE idWorks = ?`;
        values.push(idWorks); // Ajout de l'idWorks à la fin des valeurs

        dbOeuvres.query(sqlUpdateWork, values, (err: Error | null, result: any) => {
            if (err) {
                return res.status(500).send({ message: 'Erreur lors de la mise à jour de l\'œuvre', error: err });
            }

            // Traitement des nouvelles images
            if (customReq.newFileName && customReq.newFileName.length > 0) {
                const sqlInsertPicture: string = "INSERT INTO pictures(pictures, idWorks) VALUES (?, ?)";
                const promises = customReq.newFileName.map((picture) => {
                    return new Promise<void>((resolve, reject) => {
                        dbOeuvres.query(sqlInsertPicture, [picture, idWorks], (err: Error | null) => {
                            if (err) {
                                return reject(res.status(500).send({ message: 'Erreur lors de l\'insertion de l\'image', error: err }));
                            }
                            resolve();
                        });
                    });
                });

                Promise.all(promises)
                    .then(() => res.status(200).send({ message: 'L\'œuvre a été mise à jour avec succès' }))
                    .catch((error) => console.error('Erreur lors de l\'insertion des images', error));
            } else {
                res.status(200).send({ message: 'L\'œuvre a été mise à jour avec succès' });
            }
        });
    }
);


routerOeuvres.get('/list', authenticateJWT, (req: Request, res: Response) => {
    // SQL query to get all works with associated pictures
    const sql = `
        SELECT w.idWorks, w.name, w.description, w.idArtist, GROUP_CONCAT(p.pictures) AS pictures
        FROM works w
        LEFT JOIN pictures p ON w.idWorks = p.idWorks
        GROUP BY w.idWorks
    `;
    
    dbOeuvres.query(sql, (err: Error | null, results: any) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la récupération des œuvres', error: err });
        }

        // Process results to convert pictures from comma-separated string to an array
        const formattedResults = results.map((work: any) => ({
            ...work,
            pictures: work.pictures ? work.pictures.split(',') : [] // Split pictures into an array
        }));

        // Send success response with the list of works and their associated pictures
        res.status(200).json(formattedResults);
    });
});

module.exports = routerOeuvres;
