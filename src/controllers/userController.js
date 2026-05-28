import {
  registerUser,
  loginUser,
  softDeleteUser,
  verifyEmailToken,
  getUsers,
} from '../services/userService.js';
import { generateToken } from '../utils/generateToken.js';
import { sendEmail } from '../utils/sendEmail.js';
import prisma from '../../lib/prisma.js';

// ─── REGISTER ─────────────────────────────────────────────────────────────────

export async function userRegister(req, reply) {
  const { name, email, password, role, tenantId } = req.body;

  if (!name || !email || !password || !role || !tenantId) {
    return reply
      .status(400)
      .send({ error: 'Todos os campos são obrigatórios.' });
  }

  const validRoles = ['admin', 'tecnico', 'usuario'];
  if (!validRoles.includes(role)) {
    return reply.status(400).send({ error: 'Role inválida.' });
  }

  try {
    const userExists = await prisma.users.findUnique({ where: { email } });
    if (userExists) throw new Error('E-mail já cadastrado.');

    const verificationToken = generateToken(8);

    await registerUser(
      name,
      email,
      password,
      role,
      verificationToken,
      tenantId,
    );

    const verificationLink = `http://localhost:3000/confirm-email?email=${email}&token=${verificationToken}`;

    await sendEmail(
      email,
      'Código de verificação - ATOS',
      `Seu código de verificação é: ${verificationToken}\nlink para verificação: ${verificationLink}`,
    );

    return reply
      .status(200)
      .send({ message: 'Por favor, Verifique seu e-mail.' });
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
}

// ─── CONFIRM EMAIL ────────────────────────────────────────────────────────────

export async function confirmEmail(req, reply) {
  const { email, token } = req.body;

  if (!email || !token) {
    return reply
      .status(400)
      .send({ error: 'E-mail e token são obrigatórios.' });
  }

  try {
    const result = await verifyEmailToken(email, token);
    return reply.send(result);
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export async function userLogin(req, reply) {
  const { email, password } = req.body;

  if (!email || !password) {
    return reply
      .status(400)
      .send({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const data = await loginUser(email, password);
    return reply.send(data);
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
}

// ─── GET USERS (admin) ────────────────────────────────────────────────────────

export async function getUsersController(req, reply) {
  try {
    if (req.user.role !== 'admin') {
      return reply.status(403).send({ error: 'Acesso negado.' });
    }
    const users = await getUsers(req.user.tenantId);
    return reply.send(users);
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

// ─── SOFT DELETE ──────────────────────────────────────────────────────────────

export async function userSoftDelete(req, reply) {
  try {
    if (req.user.role !== 'admin') {
      return reply
        .status(403)
        .send({ error: 'Apenas administradores podem inativar usuários.' });
    }

    if (req.params.id === req.user.id) {
      return reply
        .status(400)
        .send({ error: 'Você não pode inativar sua própria conta.' });
    }

    const result = await softDeleteUser(req.params.id, req.user.tenantId);
    return reply.send(result);
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
}
