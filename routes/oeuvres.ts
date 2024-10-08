const expressOeuvres = require('express');
const routerOeuvres = expressOeuvres.Router();
import {Request, Response } from 'express';
import authenticateJWT from '../middleware/authenticateJWT';
import { unlink } from 'node:fs';
const dbOeuvres = require( '../config/db.ts' )
const { query, validationResult , check, body} = require('express-validator');

const fs = require("fs");
const multer  = require('multer');
interface CustomRequest extends Request {
    newFileName?: string[]; 
  }

const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        const path = `./uploads`
        fs.mkdirSync(path, { recursive: true })  
        return cb(null, path);
    },
    filename: async (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const customReq = req as CustomRequest;
        const namePicture = file.originalname;
        const splitNamePicture = namePicture.split('.');
        const typeName = splitNamePicture.pop(); 
        const originalName = splitNamePicture.join('.'); // nom sans extension
    
        // Créer un nom de fichier unique
        let newFileName = `${originalName}-${uniqueSuffix}.${typeName}`;
    
        // Vérifier dans la base de données si le nom existe déjà
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
})
async function checkIfFileExistsInDB(filename: string): Promise<boolean> {
    const sql = 'SELECT pictures FROM pictures WHERE pictures = ?';
    const [results] = await dbOeuvres.promise().query(sql, [filename]);
    return results.length > 0;
}
  const upload = multer({ storage: storage })




interface Oeuvres {
    id: number;
    name: string;
    isCreatedAt : string;
    idArtist: number;
    description: string;
    pictures:string[];
    req: Request;
}
interface InsertResult {
    insertId: number;
    affectedRows: number;
    warningStatus: number;
  }
  let pictures:  string[] =[]
class Oeuvres{
    constructor( name: string, isCreatedAt: string,idArtist:number,description:string, pictures:string[]){
        this.name = name;
        this.isCreatedAt = isCreatedAt;
        this.idArtist = idArtist
        this.description = description ;
        this.pictures = pictures;
    }


    create = (sql: string,res: Response)=>{
       dbOeuvres.query(sql, [ this.name, this.isCreatedAt,this.idArtist,this.description], async (err: Error | null, results : InsertResult)=>{
            if(err){
                return res.status(500).send({message : 'erreur', 'type': err});
            } 
            const workId = results.insertId;
            const sqlPicture :string = "INSERT INTO pictures(pictures, idWorks ) VALUES (?,?)"
            for(let i = 0;i <this.pictures.length ;i++){
               dbOeuvres.query(sqlPicture, [this.pictures[i], workId  ], async (err: Error | null, results : InsertResult)=>{
                    if(err){
                        return res.status(500).send({'message' : 'erreur', 'type': err});
                    }
                    res.status(201).send({'message':"oeuvres inserée."}) 
                })
            } 
        })
    }

     update = (sql: string,res: Response, id:number)=>{
         const isInDB:string ="SELECT * FROM works WHERE idWorks =?";
         dbOeuvres.query(isInDB, [  id], async (err: Error | null, results : any)=>{
            console.log(results)
              if(results.length >0){
               dbOeuvres.query(sql, [ this.name, this.isCreatedAt,this.idArtist,this.description, id], async (err: Error | null, results : InsertResult)=>{
                    if(err){
                        return res.status(500).send({message : 'erreur', 'type': err});
                    }
                    const select :string = "SELECT * FROM pictures WHERE idWorks= ?"
                    dbOeuvres.query(select, [ id], async (err: Error | null, results : any)=>{
                        if(results){
                            for(let i =0;i<results.length; i++)
                                unlink("uploads/"+results[i].pictures, (err) => {
                                    if (err) throw err;
                            });
                        }
                    })
                    const sqlDeletePath : string = "DELETE FROM pictures WHERE idWorks=?"
                    dbOeuvres.query(sqlDeletePath, [ id  ], async (err: Error | null, results : InsertResult)=>{
                        if(err){
                            return res.status(500).send({'message' : 'erreur', 'type': err});
                        }
                    })
                    const sqlPicture :string = "INSERT INTO pictures(pictures, idWorks) VALUES(?,?)"
                    for(let i = 0;i <this.pictures.length ;i++){
                        dbOeuvres.query(sqlPicture, [this.pictures[i], id  ], async (err: Error | null, results : InsertResult)=>{
                            if(err){
                                return res.status(500).send({'message' : 'erreur', 'type': err});
                            }
                            res.status(201).send({'message':"oeuvres modifié."}) 
                        })
                    } 
                })
            }else{
                return res.status(500).send({message : 'pas dans bdd'});
            }
        })
     }
     shutDown = (sql: string,res: Response, id:number)=>{
        const isInDB:string ="SELECT * FROM works WHERE idWorks=?";
        dbOeuvres.query(isInDB, [id], async (err: Error | null, results : any)=>{
            if(results.length >0){ 
                dbOeuvres.query(sql, [ id], async (err: Error | null, results : InsertResult)=>{
                    if(err){
                       return res.status(500).send({message : 'erreur', 'type': err});
                    }
                    res.status(200).send({'message':"oeuvres shudown"})   
               })
           }else{
               return res.status(500).send({message : 'pas dans bdd'});
           }
       })
    }
}


routerOeuvres.post('/admin/create',
    authenticateJWT,
    upload.fields([{ name: 'image', maxCount: 8 }]),
    body('name').trim().notEmpty().escape(), 
    body('isCreatedAt').isDate({format: 'YYYY-MM-DD'}).escape(),
    body('idArtist').isInt().escape(),
    body('description').trim().notEmpty().escape(),
    
    async(req: Request,res: Response)=>{
    const customReq = req as CustomRequest;
    const {name, isCreatedAt,idArtist,description} = req.body ;
    const sql = "INSERT INTO works(name, isCreatedAt,idArtist,description) VALUES (?,?,?,?)";
    const result = validationResult(req);
    if (result.isEmpty()) {
        let a: string[] = [] ; 
        if(customReq.newFileName){
            a = customReq.newFileName
        }
        const oeuvre = new Oeuvres(name, isCreatedAt,idArtist,description, a);
        oeuvre.create(sql, res )
    }else{
        res.send({ errors: result.array() });
    }  
})
routerOeuvres.put('/admin/update',
    authenticateJWT,
    upload.fields([{ name: 'image', maxCount: 8 }
      ]),
    body('name').trim().notEmpty().escape(), 
    body('isCreatedAt').isDate({format: 'YYYY-MM-DD'}).escape(),
    body('idArtist').isInt().escape(),
    body('description').trim().notEmpty().escape(),
    
    async(req: Request,res: Response)=>{
        try{
            const customReq = req as CustomRequest;
            const {name, isCreatedAt,idArtist,description, idWorks} = req.body ;
            const sql = "UPDATE works SET name=?, isCreatedAt=?, idArtist=?,  description=? WHERE idWorks=?";
            const result = validationResult(req);
            if (result.isEmpty()) {
                let a: string[] = [] ; 
                if(customReq.newFileName){
                    a = customReq.newFileName
                }
                const oeuvre = new Oeuvres(name, isCreatedAt,idArtist,description, a);
                oeuvre.update(sql, res, idWorks)
            }else{
                res.send({ errors: result.array() });
            }  
        }catch(error){
            res.status(500).send({message : 'erreur', 'type': error});     
        }
    })
routerOeuvres.put('/admin/shutdown',
    authenticateJWT,
    async(req: Request,res: Response)=>{
        try{
            const {idWorks} = req.body ;
            const sql = "UPDATE works SET isAvailable= 0 WHERE idWorks=?";
            const result = validationResult(req);
            if (result.isEmpty()) {
                const oeuvre = new Oeuvres("", "",1,"description", []);
                oeuvre.shutDown(sql, res, idWorks)
            }else{
                res.send({ errors: result.array() });
            }  
        }catch(error){
            res.status(500).send({message : 'erreur', 'type': error});     
        }
    })
module.exports = routerOeuvres ;