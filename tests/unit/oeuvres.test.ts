
// import { Request, Response } from 'express';
// import { describe, expect, test, jest } from '@jest/globals';
// import request, { Response as SupertestResponse } from 'supertest';
// import express from 'express';
// import jwt from 'jsonwebtoken';
// import bcrypt from 'bcrypt';
// const routerOeuvres = require('../../routes/oeuvres');
// const db = require('../../config/db');
// import path from 'path';
// jest.mock('../../config/db'); // Moquer la base de données.

// const app = express();
// app.use(express.json());
// app.use('/oeuvres', routerOeuvres);

// describe('test routes to works', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   afterAll(() => {
//     // Réinitialiser les mocks et autres configurations après tous les tests
//     jest.resetAllMocks();
//   });

//   it('should create a work (POST /oeuvres/admin/create)', async () => {
//     const testFilePath = path.join(__dirname, 'test-image.jpg');

//     const oeuvre = {
//       id: 4,
//       name: "string",
//       isCreatedAt: "2024-01-01",
//       idArtist: 1, // Représente un ID numérique
//       description: "string"
//     };

//     db.query.mockImplementation((sql: string, values: any[], callback: (err: Error | null, result: any) => void) => {
//       callback(null, { affectedRows: 1 });
//     });

//     const response: SupertestResponse = await request(app)
//       .post('/oeuvres/admin/create')
//       .field('name', 'Test Oeuvre')
//       .field('isCreatedAt', '2024-10-01')
//       .field('idArtist', '1')
//       .field('description', 'A wonderful piece of art')
//       .attach('image', testFilePath)
//       ;

//     expect(response.status).toBe(201);
//     expect(response.body.message).toBe("oeuvres crée.");
//   });
// });


import { Request, Response } from 'express';
import { describe, expect, test, jest } from '@jest/globals';
import request, { Response as SupertestResponse } from 'supertest';
import express from 'express';
import path from 'path';
const routerOeuvres = require('../../routes/oeuvres');
const db = require('../../config/db');
jest.mock('../../config/db'); // Mocker la base de données.

const app = express();
app.use(express.json());
app.use('/oeuvres', routerOeuvres);

describe('Test des routes pour les oeuvres', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it('devrait créer une oeuvre (POST /oeuvres/admin/create)', async () => {
    const testFilePath = path.join(__dirname, '/Users/mohamedmanseur/Desktop/galerie art/backosmose/uploads/643cd7a7-d8cd-4856-ac41-976987c0078d-1728044201437-315964874.jpeg'); // Assurez-vous que ce chemin est correct

    // Mock de la base de données
    db.query.mockImplementation((sql: string, values: any[], callback: (err: Error | null, result: any) => void) => {
      callback(null, { affectedRows: 1, insertId: 123 }); // Simule une insertion réussie avec un ID d'oeuvre généré
    });

    const response: SupertestResponse = await request(app)
      .post('/oeuvres/admin/create')
      .field('name', 'Test Oeuvre')
      .field('isCreatedAt', '2024-10-01')
      .field('idArtist', '1')
      .field('description', 'A wonderful piece of art')
      .attach('image', testFilePath); // Attache l'image depuis le fichier local

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('oeuvres crée.');
    expect(response.body).toHaveProperty('oeuvreId'); // Vérifie que l'ID est renvoyé
  });
});
