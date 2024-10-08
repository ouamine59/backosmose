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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const routerUsers = require('../../routes/users');
const db = require('../../config/db');
globals_1.jest.mock('../../config/db'); // Moquer la base de données.
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/users', routerUsers);
(0, globals_1.describe)('test routes to users', () => {
    beforeEach(() => {
        globals_1.jest.clearAllMocks();
    });
    it('should login a user (POST /users/login)', () => __awaiter(void 0, void 0, void 0, function* () {
        const hashedPassword = yield bcrypt_1.default.hash('1234', 10);
        // Simuler un utilisateur avec tous les champs nécessaires pour créer le JWT
        const user = {
            id: 4,
            username: 'admin',
            password: hashedPassword,
            role: { 'role': 'admin' },
            name: 'John',
            lastname: 'Doe'
        };
        const secret = '1983';
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, secret, { expiresIn: '1d' });
        // Simuler la base de données
        db.query.mockImplementation((sql, values, callback) => {
            callback(null, [user]);
        });
        // Envoyer la requête avec le mot de passe brut
        const response = yield (0, supertest_1.default)(app)
            .post('/users/login')
            .send({ username: 'admin', password: 'Ouamine59@' }); // Mot de passe brut envoyé par l'utilisateur
        (0, globals_1.expect)(response.status).toBe(201);
        (0, globals_1.expect)(response.body).toHaveProperty('token');
    }));
});
