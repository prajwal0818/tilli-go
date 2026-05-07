import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import config from '../config';
import { registerSchema, loginSchema } from '../validators/authValidator';
import type { JwtTokenPayload, AuthResponse } from '../types';

function signToken(user: { id: string; email: string; role: string }): string {
  const payload: JwtTokenPayload = { sub: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, config.jwtSecret!, { expiresIn: '24h' });
}

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashed = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: { email: data.email, password: hashed, name: data.name },
    });

    const token = signToken(user);

    const body: AuthResponse = {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };

    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signToken(user);

    const body: AuthResponse = {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };

    res.status(200).json(body);
  } catch (err) {
    next(err);
  }
};
