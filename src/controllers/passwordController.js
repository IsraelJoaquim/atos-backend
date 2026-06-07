import { forgotPassword, resetPassword } from '../services/passwordService.js';

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────

export async function forgotPasswordController(req, reply) {
  const { email } = req.body;

  if (!email) {
    return reply.status(400).send({ error: 'E-mail é obrigatório.' });
  }

  try {
    await forgotPassword(email);
    // sempre retorna sucesso para não revelar se o email existe
    return reply.send({ message: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.' });
  } catch (error) {
    return reply.status(500).send({ error: 'Erro ao processar solicitação.' });
  }
}

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────

export async function resetPasswordController(req, reply) {
  const { email, token, password } = req.body;

  if (!email || !token || !password) {
    return reply.status(400).send({ error: 'Todos os campos são obrigatórios.' });
  }

  if (password.length < 6) {
    return reply.status(400).send({ error: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    const result = await resetPassword(email, token, password);
    return reply.send(result);
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
}
