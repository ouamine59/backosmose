const expressOeuvres = require('express');
const routerOeuvres = expressOeuvres.Router();

import {Request, Response } from 'express';

const dbOeuvres = require( '../config/db.ts' )
const { query, validationResult , check, body} = require('express-validator');


interface Oeuvres {
    id: number;
    name: string;
    isCreatedAt : string;
    idArtist: number;
    description: string

}

const create = (sql: string, name: string, isCreatedAt: string,idArtist:number,description:string ,res: Response)=>{
    dbOeuvres.query(sql, [ name, isCreatedAt,idArtist,description], async (err: Error | null, results : Oeuvres[])=>{
        if(err){
            return res.status(500).send({message : 'erreur', 'type': err});
        }
        res.status(201).send({'message':"oeuvres crée."})      
    })
}

routerOeuvres.post('/admin/create',
    body('name').trim().notEmpty().escape(), 
    body('isCreatedAt').isDate({format: 'YYYY-MM-DD'}).escape(),
    body('idArtist').isInt().escape(),
    body('description').trim().notEmpty().escape(),
    async(req: Request,res: Response)=>{
    const {name, isCreatedAt,idArtist,description} = req.body ;

    const sql = "INSERT INTO works(name, isCreatedAt,idArtist,description) VALUES (?,?,?,?)";
    const result = validationResult(req);
    if (result.isEmpty()) {
        create(sql, name, isCreatedAt,idArtist,description, res)
    }else{
        res.send({ errors: result.array() });
    }  
})

module.exports = routerOeuvres ;