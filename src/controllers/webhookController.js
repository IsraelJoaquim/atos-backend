import prisma from '../../lib/prisma.js';
import { createTicket } from '../services/ticketService.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function inboundEmailWebhook(req, reply) {
  try {
    const { data } = req.body;

    const fromEmail = data?.from?.toLowerCase();
    const title = data?.subject || 'Sem assunto';
    const emailId = data?.email_id;

    if (!fromEmail) {
      return reply.status(400).send({ error: 'Remetente não encontrado.' });
    }

    // busca o corpo completo do email via API
    let description = 'Sem descrição';
    if (emailId) {
      try {
        const email = await resend.emails.get(emailId);
        description = email.data?.text || email.data?.html || 'Sem descrição';
      } catch (e) {
        console.warn('[WEBHOOK] Não foi possível buscar corpo do email:', e.message);
      }
    }

    const user = await prisma.users.findUnique({
      where: { email: fromEmail },
    });

    if (!user || !user.active || !user.email_verified) {
      return reply.status(404).send({ error: 'Usuário não encontrado ou inativo.' });
    }

    const ticket = await createTicket({
      title: title.substring(0, 100),
      description: description.substring(0, 1000),
      userId: user.id,
      tenantId: user.tenantId,
    });

    console.log(`[WEBHOOK] Chamado criado via email: ${ticket.ticket} — ${fromEmail}`);
    return reply.status(200).send({ ticket: ticket.ticket });
  } catch (error) {
    console.error('[WEBHOOK] Erro:', error.message);
    return reply.status(500).send({ error: 'Erro interno.' });
  }
}
