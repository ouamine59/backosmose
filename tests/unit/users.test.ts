// TypeScript importations
import { Request, Response } from 'express';
import { describe, expect, test, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
const  routerUsers =  require( '../../routes/users'); 
const  db = require( '../../config/db'); 

jest.mock('../../config/db'); // Moquer la base de données.

const app = express();
app.use(express.json());
app.use('/users', routerUsers);

describe('test routes to users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login a user (POST /users/login)', async () => {
    const hashedPassword = await bcrypt.hash('1234', 10);
    
    // Simuler un utilisateur avec tous les champs nécessaires pour créer le JWT
    const user = { 
      id: 4, 
      username: 'admin', 
      password: hashedPassword, 
      role: {'role':'admin'}, 
      name: 'John', 
      lastname: 'Doe' 
    };
    
    const secret = '1983';
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, secret, { expiresIn: '1d' });

    // Simuler la base de données
    db.query.mockImplementation((sql: string, values: string, callback: (err: Error | null, result: any) => void) => {
      callback(null, [user]);
    });

    // Envoyer la requête avec le mot de passe brut
    const response = await request(app)
      .post('/users/login')
      .send({ username: 'admin', password: 'Ouamine59@' });  // Mot de passe brut envoyé par l'utilisateur

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
  });
});
