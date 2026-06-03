import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';

// ─── REGISTER ─────────────────────────────────────────────────────────────────

export async function registerUser(name, email, password, active, role, verificationToken, tenantId) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      verification_token: verificationToken,
      email_verified: false,
      active: false,
      tenantId,
    },
  });
  return user;
}

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────

export async function verifyEmailToken(email, token, active) {
  const user = await prisma.users.findUnique({ where: { email } });

  if (!user) throw new Error('Usuário não encontrado.');
  if (user.verification_token !== token) throw new Error('Token inválido.');

  await prisma.users.update({
    where: { email },
    data: {
      active:true,
      email_verified: true,
      verification_token: null,
    },
  });

  return { message: 'Email verificado com sucesso!' };
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export async function loginUser(email, password) {
  const user = await prisma.users.findUnique({
  where: { email },
  include: {
    tenant: true,
  },
});

  if (!user) throw new Error('Usuário não encontrado.');
  if (!user.email_verified) throw new Error('E-mail não verificado.');
  if (!user.active) throw new Error('Usuário inativo.');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('Senha inválida.');

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role, tenantId: user.tenantId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' },
  );

  // retorna apenas campos necessários, sem senha nem token de verificação
  const {password: _,
    verification_token: __,tenant,...safeUser} = user;
  return {
    token,
    user: {
      ...safeUser,
      tenantName: tenant.name,
    },
  };
}

// ─── GET USERS (admin) ────────────────────────────────────────────────────────

export async function getUsers(tenantId) {
  const users = await prisma.users.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      email_verified: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return users;
}

// ─── UPDATE USER ──────────────────────────────────────────────────────────────

export async function updateUser(id, tenantId, { role, active }) {
  if (!id || !tenantId) throw new Error('ID e tenantId são obrigatórios.');

  const validRoles = ['admin', 'tecnico', 'usuario'];
  if (role && !validRoles.includes(role)) throw new Error('Role inválida.');

  const data = {};
  if (role !== undefined) data.role = role;
  if (active !== undefined) data.active = active;

  if (Object.keys(data).length === 0) throw new Error('Nada para atualizar.');

  const result = await prisma.users.updateMany({
    where: { id, tenantId },
    data,
  });

  if (result.count === 0) throw new Error('Usuário não encontrado.');
  return { message: 'Usuário atualizado com sucesso.' };
}


// ─── SOFT DELETE ──────────────────────────────────────────────────────────────

export async function softDeleteUser(id, tenantId) {
  if (!id || !tenantId) throw new Error('ID e tenantId são obrigatórios.');

  const result = await prisma.users.updateMany({
    where: { id, tenantId },
    data: { active: false },
  });

  if (result.count === 0) throw new Error('Usuário não encontrado.');
  return { message: 'Usuário desativado com sucesso.' };
}
