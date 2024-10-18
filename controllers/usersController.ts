import {Request, Response } from 'express';

const { validationResult } = require('express-validator');
const usersModel = require("../models/usersModel");
const secret = process.env.SECRET_KEY || 'ma-super-clef';
const jwtUsers = require('jsonwebtoken');
exports.setLogin  = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    // Validation des résultats
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).send({ errors: result.array() }); // Renvoie 400 pour les erreurs de validation
    }
    
    const r = await usersModel.getLogin(username, password) ;
    if(r.length>0){
        const token = jwtUsers.sign(
            {
                id: r.id,
                username: r.username,
                role: r.role
            },
            secret,
            { expiresIn: '1d' }
        );
    
        res.status(200).send({ token }); // Changer 201 en 200
    }else{
        return res.status(500).json({message:"erreur"})
    }
    
}