const expressUsers = require('express');
const routerUsers = expressUsers.Router();
const bcryptUsers = require('bcrypt');
import {Request, Response } from 'express';
const jwtUsers = require('jsonwebtoken')
const dbUsers = require( '../config/db.ts' )
import authenticateJWT from '../middleware/authenticateJWT';
const { query, validationResult , check, body} = require('express-validator');

const secret = process.env.SECRET_KEY || 'ma-super-clef'
interface User {
    id: number;
    username: string;
    role: string;
    password?: string; 

}

const login = (sql: string, username: string, password: string, res: Response)=>{
    dbUsers.query(sql, [username], async (err: Error | null, results : User[])=>{
        if(err){
            return res.status(500).send({message : 'erreur', 'type': err});
        }
        if(results.length===0 || !(await bcryptUsers.compare(password , results[0].password))){
            return res.status(401).send({message:'nom utilisateur ou mot de passe incorrect'})
        }
        const user: User = {
            id: results[0].id,
            username: results[0].username,
            role: results[0].role
        };
        const token = jwtUsers.sign(
            {
                id: user.id,
                username:  user.username,
                role:  user.role
            },
            secret,
            { expiresIn:'1d'}
        )
        res.status(201).send({token})      
    })
}
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
routerUsers.post('/login',
    
    body('username').trim().notEmpty(), 
    body('password').isStrongPassword({minLength:8,minLowercase:1,minUppercase:1,minNumbers:1,minSymbols:1}), 
    async(req: Request,res: Response)=>{
    const {username, password} = req.body ;
    const hashedPassword = await bcryptUsers.hash(password, 10);
    const sql = "SELECT * FROM admin WHERE username=?";
    const result = validationResult(req);
    if (result.isEmpty()) {
        login(sql, username, password, res)
    }else{
        res.send({ errors: result.array() });
    }  
})

module.exports = routerUsers ;