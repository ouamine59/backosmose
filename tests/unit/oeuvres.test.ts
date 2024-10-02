
import { Request, Response } from 'express';
import { describe, expect, test, jest } from '@jest/globals';
import request, { Response as SupertestResponse } from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
const routerOeuvres = require('../../routes/oeuvres');
const db = require('../../config/db');

jest.mock('../../config/db'); // Moquer la base de données.

const app = express();
app.use(express.json());
app.use('/oeuvres', routerOeuvres);

describe('test routes to works', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Réinitialiser les mocks et autres configurations après tous les tests
    jest.resetAllMocks();
  });

  it('should create a work (POST /oeuvres/admin/create)', async () => {
    const oeuvre = {
      id: 4,
      name: "string",
      isCreatedAt: "2024-01-01",
      idArtist: 1, // Représente un ID numérique
      description: "string"
    };

    db.query.mockImplementation((sql: string, values: any[], callback: (err: Error | null, result: any) => void) => {
      callback(null, { affectedRows: 1 });
    });

    const response: SupertestResponse = await request(app)
      .post('/oeuvres/admin/create')
      .send({
        name: "string",
        isCreatedAt: "2024-01-01",
        idArtist: 1,
        description: "string"
      });

    expect(response.status).toBe(201);
  });
});
