import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, User } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'almoxarifado_super_secure_jwt_secret_2025_prod_key';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function generateTempToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      action: 'CHANGE_PASSWORD'
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

export function verifyTempToken(token: string): { id: string; username: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.action === 'CHANGE_PASSWORD') {
      return { id: decoded.id, username: decoded.username };
    }
    return null;
  } catch {
    return null;
  }
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Não autorizado. Acesso restrito ao Painel do Coordenador.',
      code: 'UNAUTHORIZED'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
    const user = db.findUserById(decoded.id) || db.getAdminUser();

    if (!user) {
      res.status(401).json({
        error: 'Sessão inválida.',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({
      error: 'Sessão expirada ou token inválido. Por favor, faça login novamente.',
      code: 'TOKEN_INVALID'
    });
  }
}
