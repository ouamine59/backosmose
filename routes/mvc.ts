const expressOeuvres = require('express');
const routerOeuvres = expressOeuvres.Router();
const multer  = require('multer');
const mvc = require('../controllers/mvc')
import { unlink } from 'node:fs';
import path from 'path';
import authenticateJWT from '../middleware/authenticateJWT';
const { query,  check, body} = require('express-validator');
routerOeuvres.post("/oeuvres",[body("idWorks").isInt()], mvc.getOeuvreById)

module.exports = routerOeuvres ;