import prisma from '../../lib/prisma.js';
import { createTicket } from '../services/ticketService.js';

export async function inboundEmailWebhook(req, reply) {
  try {
    // Mailgun envia como form-data, não JSON
    const fromEmail = req.body?.sender?.toLowerCase() ||
                      req.body?.from?.toLowerCase();
    const title = req.body?.subject || 'Sem assunto';
    const description = req.body?.['body-plain'] ||
                        req.body?.['body-html'] ||
                        'Sem descrição';

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
