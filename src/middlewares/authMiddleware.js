import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';

export async function authenticateToken(req, reply) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return reply.status(401).send({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // busca o usuário no banco para garantir que está ativo
    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, tenantId: true, active: true },
    });

    if (!user) {
      return reply.status(401).send({ error: 'Usuário não encontrado.' });
    }

    if (!user.active) {
      return reply.status(403).send({ error: 'Usuário inativo.' });
    }

    req.user = user;
  } catch (error) {
    return reply.status(403).send({ message: 'Token inválido' });
  }
}

export function authorizeAdmin(req, reply, done) {
  if (req.user.role !== 'admin') {
    return reply.status(403).send({ message: 'Acesso negado' });
  }
  done();
}
