import { Router } from "express";
import prisma from "../../config/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const authRouter = Router();

// Function to verify the password
const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Function to generate JWT token
const generateToken = (userId: number): string => {
  // Get the secret key from environment variables
  const secretKey = process.env.JWT_SECRET || 'your-default-secret-key';
  
  // Create token with user ID and expiration time
  return jwt.sign(
    { userId },
    secretKey,
    { expiresIn: '24h' } // Token expires in 24 hours
  );
  
};

// Login route
authRouter.post('/login', async (req: any, res: any) => {
  const { email , password }: { email: string, password: string } = req.body;
  
  try {
    const user : any  = await prisma.user.findUnique({
          where : {
             email
          }
    })
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Verify the password
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Generate a token
    const token = generateToken(user.id);
    
    // Return the token along with user info (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      token,
      user: userWithoutPassword 
    });
  }
  catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});