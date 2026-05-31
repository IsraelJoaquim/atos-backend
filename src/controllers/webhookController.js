import prisma from '../../lib/prisma.js';
import { createTicket } from '../services/ticketService.js';
import busboy from 'busboy';

export async function inboundEmailWebhook(req, reply) {
  try {
    const fields = await new Promise((resolve, reject) => {
      const bb = busboy({ headers: req.headers });
      const result = {};
      bb.on('field', (name, val) => { result[name] = val; });
      bb.on('finish', () => resolve(result));
      bb.on('error', reject);
      req.raw.pipe(bb);
    });

    console.log('[WEBHOOK] Fields:', JSON.stringify(fields));

    const fromEmail = fields?.sender?.toLowerCase() ||
                      fields?.from?.toLowerCase();
    const title = fields?.subject || 'Sem assunto';
    const description = fields?.['body-plain'] ||
                        fields?.['stripped-text'] ||
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

    console.log(`[WEBHOOK] Chamado criado: ${ticket.ticket} — ${fromEmail}`);
    return reply.status(200).send({ ticket: ticket.ticket });
  } catch (error) {
    console.error('[WEBHOOK] Erro:', error.message);
    return reply.status(500).send({ error: 'Erro interno.' });
  }
}
