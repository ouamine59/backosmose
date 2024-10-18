const expressUsers = require('express');
const routerUsers = expressUsers.Router();
const bcryptUsers = require('bcrypt');
const jwtUsers = require('jsonwebtoken');
import authenticateJWT from '../middleware/authenticateJWT';
const {  body} = require('express-validator');
const usersController = require('../controllers/usersController')


routerUsers.post("/login",[body('username').trim().notEmpty(),
    body('password').isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    })], usersController.setLogin)

module.exports = routerUsers ;












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