"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const expressUsers = require('express');
const routerUsers = expressUsers.Router();
const bcryptUsers = require('bcrypt');
const jwtUsers = require('jsonwebtoken');
const dbUsers = require('../config/db.ts');
const { query, validationResult, check, body } = require('express-validator');
const secret = process.env.SECRET_KEY || 'ma-super-clef';
const login = (sql, username, password, res) => {
    dbUsers.query(sql, [username], (err, results) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            return res.status(500).send({ message: 'erreur', 'type': err });
        }
        if (results.length === 0 || !(yield bcryptUsers.compare(password, results[0].password))) {
            return res.status(401).send({ message: 'nom utilisateur ou mot de passe incorrect' });
        }
        const user = {
            id: results[0].id,
            username: results[0].username,
            role: results[0].role
        };
        const token = jwtUsers.sign({
            id: user.id,
            username: user.username,
            role: user.role
        }, secret, { expiresIn: '1d' });
        res.status(201).send({ token });
    }));
};
/**
 * @swagger
 * /users:
 *  get:
 *      summary : log l'admin
 *      response:
 *          200:
 *              description: cree un token
 *              content:
 *                  application/json:
 *                      schema:
 *                          type : objet
 *                          items:
 *                              type: object
 *                              properties :
 *                                  username:
 *                                      type: string
 *                                      example : 24
 *                                  password :
 *                                      type: string
 *                                      example : 'tot'
 */
routerUsers.post('/login', body('username').trim().notEmpty(), body('password').isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const hashedPassword = yield bcryptUsers.hash(password, 10);
    const sql = "SELECT * FROM admin WHERE username=?";
    const result = validationResult(req);
    if (result.isEmpty()) {
        login(sql, username, password, res);
    }
    else {
        res.send({ errors: result.array() });
    }
}));
module.exports = routerUsers;
