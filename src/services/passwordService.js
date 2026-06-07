import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma.js';
import { generateToken } from '../utils/generateToken.js';
import { sendEmail } from '../utils/sendEmail.js';

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────

export async function forgotPassword(email) {
  const user = await prisma.users.findUnique({ where: { email } });

  // não revela se o email existe ou não por segurança
  if (!user || !user.active || !user.email_verified) return;

  const token = generateToken(32);
  const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

  await prisma.users.update({
    where: { email },
    data: {
      reset_token: token,
      reset_token_expires: expires,
    },
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  await sendEmail(
    email,
    'Redefinição de senha - ATOS',
    `Você solicitou a redefinição da sua senha.\n\nClique no link abaixo para criar uma nova senha (válido por 30 minutos):\n\n${resetLink}\n\nSe não foi você, ignore este e-mail.`,
  );
}

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────

export async function resetPassword(email, token, newPassword) {
  const user = await prisma.users.findUnique({ where: { email } });

  if (!user) throw new Error('Token inválido ou expirado.');
  if (!user.reset_token || user.reset_token !== token) throw new Error('Token inválido ou expirado.');
  if (!user.reset_token_expires || user.reset_token_expires < new Date()) {
    throw new Error('Token expirado. Solicite uma nova redefinição de senha.');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.users.update({
    where: { email },
    data: {
      password: hashedPassword,
      reset_token: null,
      reset_token_expires: null,
    },
  });

  return { message: 'Senha redefinida com sucesso.' };
}
