import prisma from '../../lib/prisma.js';
import { createTicket } from '../services/ticketService.js';

export async function inboundEmailWebhook(req, reply) {
  try {
    const body = req.body || {};

    // Resend format
    let fromEmail, title, emailId;
    if (body?.type === 'email.received' && body?.data) {
      fromEmail = body.data.from?.toLowerCase();
      title = body.data.subject || 'Sem assunto';
      emailId = body.data.email_id;
    } else {
      // Mailgun format
      fromEmail = (body?.sender || body?.from || '')
        .replace(/.*<(.+)>/, '$1').toLowerCase().trim();
      title = body?.subject || 'Sem assunto';
    }

    console.log('[WEBHOOK] From:', fromEmail, 'Title:', title);

    if (!fromEmail) {
      return reply.status(400).send({ error: 'Remetente não encontrado.' });
    }

    const user = await prisma.users.findUnique({
      where: { email: fromEmail },
    });

    if (!user || !user.active || !user.email_verified) {
      return reply.status(404).send({ error: 'Usuário não encontrado ou inativo.' });
    }

    const ticket = await createTicket({
      title: title.substring(0, 100),
      description: 'Chamado aberto via email.',
      userId: user.id,
      tenantId: user.tenantId,
    });

    console.log(`[WEBHOOK] Chamado criado: ${ticket.ticket} — ${fromEmail}`);
    return reply.status(200).send({ ticket: ticket.ticket });
  } catch (error) {
    console.error('[WEBHOOK] Erro:', error.message);
    return reply.status(500).send({ error: 'Erro interno.' });
  }
}
