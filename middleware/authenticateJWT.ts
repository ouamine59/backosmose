
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
require ('dotenv').config();
const secretKey: string |any= process.env.SECRET_KEY;  
console.log("secret key334AA : ",secretKey)
// Middleware function
const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ message: 'Access token is missing' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    // Attach user information to request object
    //req.user = decoded; 
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export default authenticateJWT;