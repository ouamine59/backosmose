import {Request, Response } from 'express';

const fs = require("fs");
const { validationResult } = require('express-validator');
const oeuvreModel = require("../models/oeuvreModel")

exports.getOeuvreById =async(req:Request,res:Response)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(500).json({errors: errors.array()})
    }
    const {idWorks} = req.body ;
    const result = await oeuvreModel.getOeuvreById(idWorks) ;
    if(result.length>0){
        return res.status(200).send(result)
    }else{
        return res.status(500).json({message:"erreur"})
    }
}