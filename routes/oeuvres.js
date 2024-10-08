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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expressOeuvres = require('express');
const routerOeuvres = expressOeuvres.Router();
const authenticateJWT_1 = __importDefault(require("../middleware/authenticateJWT"));
const node_fs_1 = require("node:fs");
const dbOeuvres = require('../config/db.ts');
const { query, validationResult, check, body } = require('express-validator');
const fs = require("fs");
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const path = `./uploads`;
        fs.mkdirSync(path, { recursive: true });
        return cb(null, path);
    },
    filename: (req, file, cb) => __awaiter(void 0, void 0, void 0, function* () {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const customReq = req;
        const namePicture = file.originalname;
        const splitNamePicture = namePicture.split('.');
        const typeName = splitNamePicture.pop();
        const originalName = splitNamePicture.join('.'); // nom sans extension
        // Créer un nom de fichier unique
        let newFileName = `${originalName}-${uniqueSuffix}.${typeName}`;
        // Vérifier dans la base de données si le nom existe déjà
        let fileExists = yield checkIfFileExistsInDB(newFileName);
        while (fileExists) {
            const newUniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            newFileName = `${originalName}-${newUniqueSuffix}.${typeName}`;
            fileExists = yield checkIfFileExistsInDB(newFileName);
        }
        if (!customReq.newFileName) {
            customReq.newFileName = [];
        }
        customReq.newFileName.push(newFileName);
        cb(null, newFileName);
    })
});
function checkIfFileExistsInDB(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        const sql = 'SELECT pictures FROM pictures WHERE pictures = ?';
        const [results] = yield dbOeuvres.promise().query(sql, [filename]);
        return results.length > 0;
    });
}
const upload = multer({ storage: storage });
let pictures = [];
class Oeuvres {
    constructor(name, isCreatedAt, idArtist, description, pictures) {
        this.create = (sql, res) => {
            dbOeuvres.query(sql, [this.name, this.isCreatedAt, this.idArtist, this.description], (err, results) => __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    return res.status(500).send({ message: 'erreur', 'type': err });
                }
                const workId = results.insertId;
                const sqlPicture = "INSERT INTO pictures(pictures, idWorks ) VALUES (?,?)";
                for (let i = 0; i < this.pictures.length; i++) {
                    dbOeuvres.query(sqlPicture, [this.pictures[i], workId], (err, results) => __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            return res.status(500).send({ 'message': 'erreur', 'type': err });
                        }
                        res.status(201).send({ 'message': "oeuvres inserée." });
                    }));
                }
            }));
        };
        this.update = (sql, res, id) => {
            const isInDB = "SELECT * FROM works WHERE idWorks =?";
            dbOeuvres.query(isInDB, [id], (err, results) => __awaiter(this, void 0, void 0, function* () {
                console.log(results);
                if (results.length > 0) {
                    dbOeuvres.query(sql, [this.name, this.isCreatedAt, this.idArtist, this.description, id], (err, results) => __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            return res.status(500).send({ message: 'erreur', 'type': err });
                        }
                        const select = "SELECT * FROM pictures WHERE idWorks= ?";
                        dbOeuvres.query(select, [id], (err, results) => __awaiter(this, void 0, void 0, function* () {
                            if (results) {
                                for (let i = 0; i < results.length; i++)
                                    (0, node_fs_1.unlink)("uploads/" + results[i].pictures, (err) => {
                                        if (err)
                                            throw err;
                                    });
                            }
                        }));
                        const sqlDeletePath = "DELETE FROM pictures WHERE idWorks=?";
                        dbOeuvres.query(sqlDeletePath, [id], (err, results) => __awaiter(this, void 0, void 0, function* () {
                            if (err) {
                                return res.status(500).send({ 'message': 'erreur', 'type': err });
                            }
                        }));
                        const sqlPicture = "INSERT INTO pictures(pictures, idWorks) VALUES(?,?)";
                        for (let i = 0; i < this.pictures.length; i++) {
                            dbOeuvres.query(sqlPicture, [this.pictures[i], id], (err, results) => __awaiter(this, void 0, void 0, function* () {
                                if (err) {
                                    return res.status(500).send({ 'message': 'erreur', 'type': err });
                                }
                                res.status(201).send({ 'message': "oeuvres modifié." });
                            }));
                        }
                    }));
                }
                else {
                    return res.status(500).send({ message: 'pas dans bdd' });
                }
            }));
        };
        this.shutDown = (sql, res, id) => {
            const isInDB = "SELECT * FROM works WHERE idWorks=?";
            dbOeuvres.query(isInDB, [id], (err, results) => __awaiter(this, void 0, void 0, function* () {
                if (results.length > 0) {
                    dbOeuvres.query(sql, [id], (err, results) => __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            return res.status(500).send({ message: 'erreur', 'type': err });
                        }
                        res.status(201).send({ 'message': "oeuvres shudown" });
                    }));
                }
                else {
                    return res.status(500).send({ message: 'pas dans bdd' });
                }
            }));
        };
        this.name = name;
        this.isCreatedAt = isCreatedAt;
        this.idArtist = idArtist;
        this.description = description;
        this.pictures = pictures;
    }
}
routerOeuvres.post('/admin/create', authenticateJWT_1.default, upload.fields([{ name: 'image', maxCount: 8 }]), body('name').trim().notEmpty().escape(), body('isCreatedAt').isDate({ format: 'YYYY-MM-DD' }).escape(), body('idArtist').isInt().escape(), body('description').trim().notEmpty().escape(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const customReq = req;
    const { name, isCreatedAt, idArtist, description } = req.body;
    const sql = "INSERT INTO works(name, isCreatedAt,idArtist,description) VALUES (?,?,?,?)";
    const result = validationResult(req);
    if (result.isEmpty()) {
        let a = [];
        if (customReq.newFileName) {
            a = customReq.newFileName;
        }
        const oeuvre = new Oeuvres(name, isCreatedAt, idArtist, description, a);
        oeuvre.create(sql, res);
    }
    else {
        res.send({ errors: result.array() });
    }
}));
routerOeuvres.put('/admin/update', authenticateJWT_1.default, upload.fields([{ name: 'image', maxCount: 8 }
]), body('name').trim().notEmpty().escape(), body('isCreatedAt').isDate({ format: 'YYYY-MM-DD' }).escape(), body('idArtist').isInt().escape(), body('description').trim().notEmpty().escape(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customReq = req;
        const { name, isCreatedAt, idArtist, description, idWorks } = req.body;
        const sql = "UPDATE works SET name=?, isCreatedAt=?, idArtist=?,  description=? WHERE idWorks=?";
        const result = validationResult(req);
        if (result.isEmpty()) {
            let a = [];
            if (customReq.newFileName) {
                a = customReq.newFileName;
            }
            const oeuvre = new Oeuvres(name, isCreatedAt, idArtist, description, a);
            oeuvre.update(sql, res, idWorks);
        }
        else {
            res.send({ errors: result.array() });
        }
    }
    catch (error) {
        res.status(500).send({ message: 'erreur', 'type': error });
    }
}));
routerOeuvres.put('/admin/shutdown', authenticateJWT_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { idWorks } = req.body;
        const sql = "UPDATE works SET isAvailable= 0 WHERE idWorks=?";
        const result = validationResult(req);
        if (result.isEmpty()) {
            const oeuvre = new Oeuvres("", "", 1, "description", []);
            oeuvre.shutDown(sql, res, idWorks);
        }
        else {
            res.send({ errors: result.array() });
        }
    }
    catch (error) {
        res.status(500).send({ message: 'erreur', 'type': error });
    }
}));
module.exports = routerOeuvres;
