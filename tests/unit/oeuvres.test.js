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
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
require('dotenv').config();
const secretKey = process.env.SECRET_KEY;
const jwt = require('jsonwebtoken');
const fs = require('fs');
const routerOeuvres = require('../../routes/oeuvres.ts');
const db = require('../../config/db');
globals_1.jest.mock('../../config/db', () => ({
    query: globals_1.jest.fn(),
    end: globals_1.jest.fn(),
}));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/oeuvres', routerOeuvres);
(0, globals_1.describe)('Test des routes pour les oeuvres', () => {
    beforeEach(() => {
        globals_1.jest.clearAllMocks();
    });
    afterAll(() => {
        globals_1.jest.clearAllMocks();
    });
    it('should create a work (POST /oeuvres/admin/create)', () => __awaiter(void 0, void 0, void 0, function* () {
        const testFilePath = path_1.default.join(__dirname, '../../uploads/157dae14-6a1b-4408-b12b-2cf48713ad3e-1728377833873-865866823.jpeg');
        const Oeuvres = {
            idWorks: "75",
            name: "joconde",
            isCreatedAt: "1988-08-03",
            idArtist: "1",
            description: "une description"
        };
        db.query.mockImplementation((sql, values) => {
            return Promise.resolve([Oeuvres]); // Simule une insertion réussie
        });
        globals_1.jest.mock('jsonwebtoken', () => ({
            sign: globals_1.jest.fn().mockReturnValue('mockToken'),
        }));
        const payload = { username: "admin", password: "sss" };
        const token = jwt.sign(payload, secretKey);
        const response = yield (0, supertest_1.default)(app)
            .post('/oeuvres/admin/create')
            .set('Authorization', `Bearer ${token}`)
            .field('name', 'Test Oeuvre')
            .field('isCreatedAt', '2024-10-01')
            .field('idArtist', 1)
            .field('description', 'A wonderful piece of art')
            .attach('image', testFilePath);
        (0, globals_1.expect)(response.status).toBe(201);
        (0, globals_1.expect)(response.body.message).toBe('oeuvres inserée.');
    }));
    it('should update a work (PUT /oeuvres/admin/update)', () => __awaiter(void 0, void 0, void 0, function* () {
        const testFilePath = path_1.default.join(__dirname, '../../uploads/157dae14-6a1b-4408-b12b-2cf48713ad3e-1728377833873-865866823.jpeg');
        const Oeuvres = {
            idWorks: "75",
            name: "joconde",
            isCreatedAt: "1988-08-03",
            idArtist: "1",
            description: "une description"
        };
        db.query.mockImplementation((sql, values) => {
            return Promise.resolve([{ insertId: 1 }]); // Simule une insertion réussie
        });
        globals_1.jest.mock('jsonwebtoken', () => ({
            sign: globals_1.jest.fn().mockReturnValue('mockToken'),
        }));
        const payload = { username: "admin", password: "sss" };
        const token = jwt.sign(payload, secretKey);
        const response = yield (0, supertest_1.default)(app)
            .put('/oeuvres/admin/update')
            .set('Authorization', `Bearer ${token}`)
            .field('name', 'Test Oeuvre')
            .field("idWorks", 75)
            .field('isCreatedAt', '2024-10-01')
            .field('idArtist', 1)
            .field('description', 'A wonderful piece of art')
            .attach('image', testFilePath);
        (0, globals_1.expect)(response.status).toBe(201);
        (0, globals_1.expect)(response.body.message).toBe("oeuvres modifié.");
    }));
    it('should shutdown a work (PUT /oeuvres/admin/shutdown)', () => __awaiter(void 0, void 0, void 0, function* () {
        const Oeuvres = {
            idWorks: 75
        };
        db.query.mockImplementation((sql, values) => {
            return Promise.resolve(Oeuvres); // Simule une insertion réussie
        });
        db.query.mockImplementationOnce((sql, values, callback) => {
            callback(null, { affectedRows: 1 });
        });
        globals_1.jest.mock('jsonwebtoken', () => ({
            sign: globals_1.jest.fn().mockReturnValue('mockToken'),
        }));
        const payload = { username: "admin", password: "sss" };
        const token = jwt.sign(payload, secretKey);
        const response = yield (0, supertest_1.default)(app)
            .put('/oeuvres/admin/shutdown')
            .set('Authorization', `Bearer ${token}`)
            .send({ "idWorks": 75 });
        (0, globals_1.expect)(response.status).toBe(201);
        (0, globals_1.expect)(response.body.message).toBe("oeuvres shudown");
    }));
});
