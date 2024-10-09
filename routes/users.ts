const expressUsers = require('express');
const routerUsers = expressUsers.Router();
const bcryptUsers = require('bcrypt');
import { Request, Response } from 'express';
const jwtUsers = require('jsonwebtoken');
const dbUsers = require('../config/db.ts');

const { query, validationResult, body } = require('express-validator');

const secret = process.env.SECRET_KEY || 'ma-super-clef';

interface User {
    id: number;
    username: string;
    role: string;
    password?: string;
}

const login = (sql: string, username: string, password: string, res: Response) => {
    dbUsers.query(sql, [username], async (err: Error | null, results: User[]) => {
        if (err) {
            return res.status(500).send({ message: 'Erreur du serveur', type: err });
        }

        // Vérifier si l'utilisateur existe et comparer les mots de passe
        if (results.length === 0 || !(await bcryptUsers.compare(password, results[0].password))) {
            return res.status(401).send({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
        }

        const user: User = {
            id: results[0].id,
            username: results[0].username,
            role: results[0].role
        };

        // Créer un token JWT
        const token = jwtUsers.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role
            },
            secret,
            { expiresIn: '1d' }
        );

        res.status(200).send({ token }); // Changer 201 en 200
    });
}

/** 
 * @swagger
 * /users/login:
 *  post:
 *      summary: Authentifier l'admin
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          username:
 *                              type: string
 *                              example: 'admin'
 *                          password:
 *                              type: string
 *                              example: 'password123!'
 *      responses:
 *          200:
 *              description: Token créé avec succès
 *              content: 
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              token:
 *                                  type: string
 *                                  example: 'eyJhbGciOiJIUzI1NiIsInR...'
 *          401:
 *              description: Nom d'utilisateur ou mot de passe incorrect
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: 'Nom d\'utilisateur ou mot de passe incorrect'
 *          400:
 *              description: Erreurs de validation
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              errors:
 *                                  type: array
 *                                  items:
 *                                      type: object
 *                                      properties:
 *                                          msg:
 *                                              type: string
 *                                          param:
 *                                              type: string
 */

routerUsers.post('/login',
    body('username').trim().notEmpty(),
    body('password').isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }),
    async (req: Request, res: Response) => {
        const { username, password } = req.body;
        const sql = "SELECT * FROM admin WHERE username=?";
        
        // Validation des résultats
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).send({ errors: result.array() }); // Renvoie 400 pour les erreurs de validation
        }

        // Si la validation passe, vérifie les informations de connexion
        login(sql, username, password, res);
    }
);

module.exports = routerUsers;
