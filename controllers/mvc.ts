import {Request, Response } from 'express';

const fs = require("fs");
const { validationResult } = require('express-validator');
const oeuvreModel = require("../models/oeuvreModel")

require("../types/types.ts")

exports.postOeuvres =(req:Request,res:Response)=>{
    const errors = validationResult();
    if(!errors.isEmpty()){
        return res.status(500).json({errors: errors.array()})
    }
    const {idWorks} = req.body ;
    const result = oeuvreModel.postOneOeuvre(idWorks) ;
    
    const oeuvre = result.map((elem:Oeuvre)=>{
        idWorks : elem.idWorks
    })
    console.log(oeuvre)
}