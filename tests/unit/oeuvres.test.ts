
import { Request, Response } from 'express';
import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import path from 'path';
require ('dotenv').config();
const secretKey: string |any= process.env.SECRET_KEY; 
const jwt = require('jsonwebtoken');

const fs = require('fs');
const routerOeuvres = require('../../routes/oeuvres.ts');
const db = require('../../config/db');

jest.mock('../../config/db', () => ({
  query: jest.fn(),
  end: jest.fn(),
}));


const app = express();
app.use(express.json());
app.use('/oeuvres', routerOeuvres);

describe('Test des routes pour les oeuvres', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.clearAllMocks();

  });

  it('should create a work (POST /oeuvres/admin/create)', async () => {
    const testFilePath = path.join(__dirname, '../../uploads/157dae14-6a1b-4408-b12b-2cf48713ad3e-1728377833873-865866823.jpeg'); 
    const Oeuvres = {
      idWorks: "75",
      name: "joconde",
      isCreatedAt: "1988-08-03",
      idArtist: "1",
      description: "une description"
    };

    db.query.mockImplementation((sql: string, values: any) => {
      return Promise.resolve([Oeuvres]); // Simule une insertion réussie
    });
    
    jest.mock('jsonwebtoken', () => ({
      sign: jest.fn().mockReturnValue('mockToken'),
    }));
    
    const payload = { username: "admin", password: "sss" };
    const token = jwt.sign(payload, secretKey);
    
    const response = await request(app)
      .post('/oeuvres/admin/create')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Test Oeuvre')
      .field('isCreatedAt', '2024-10-01')
      .field('idArtist', 1)
      .field('description', 'A wonderful piece of art')
      .attach('image', testFilePath);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('oeuvres inserée.');
  });
  it('should update a work (PUT /oeuvres/admin/update)', async () => {
    const testFilePath = path.join(__dirname, '../../uploads/157dae14-6a1b-4408-b12b-2cf48713ad3e-1728377833873-865866823.jpeg'); 
    const Oeuvres = {
      idWorks: "75",
      name: "joconde",
      isCreatedAt: "1988-08-03",
      idArtist: "1",
      description: "une description"
    };

    db.query.mockImplementation((sql: string, values: any) => {
      return Promise.resolve([{ insertId: 1 }]); // Simule une insertion réussie
    });
    
    jest.mock('jsonwebtoken', () => ({
      sign: jest.fn().mockReturnValue('mockToken'),
    }));
    
    const payload = { username: "admin", password: "sss" };
    const token = jwt.sign(payload, secretKey);
    
    const response = await request(app)
      .put('/oeuvres/admin/update')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Test Oeuvre')
      .field("idWorks",75)
      .field('isCreatedAt', '2024-10-01')
      .field('idArtist', 1)
      .field('description', 'A wonderful piece of art')
      .attach('image', testFilePath);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("oeuvres modifié.");
  });

  it('should shutdown a work (PUT /oeuvres/admin/shutdown)', async () => {
    const Oeuvres = {
      idWorks: 75
    };
    db.query.mockImplementation((sql: string, values: any) => {
      return Promise.resolve(Oeuvres); // Simule une insertion réussie
    });
    db.query.mockImplementationOnce((sql:string, values:any, callback:any) => {
      callback(null, { affectedRows: 1 });
    });
    jest.mock('jsonwebtoken', () => ({
      sign: jest.fn().mockReturnValue('mockToken'),
    }));
    const payload = { username: "admin", password: "sss" };
    const token = jwt.sign(payload, secretKey);
    const response = await request(app)
      .put('/oeuvres/admin/shutdown')
      .set('Authorization', `Bearer ${token}`)
      .send({"idWorks":75})

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("oeuvres shudown");
  });
});

