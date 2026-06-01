import prisma from '../../lib/prisma.js';
import { createTicket } from '../services/ticketService.js';

export async function inboundEmailWebhook(req, reply) {
  try {
    console.log('[WEBHOOK] Content-Type:', req.headers['content-type']);
    console.log('[WEBHOOK] Body:', JSON.stringify(req.body));

    // tenta pegar dados do body independente do formato
    const body = req.body || {};
    const fromEmail = (body?.sender || body?.from || '')
      .replace(/.*<(.+)>/, '$1')
      .toLowerCase()
      .trim();
    const title = body?.subject || 'Sem assunto';
    const storageKey = body?.['storage-key'] || body?.['message-url'];

    // busca corpo via API do Mailgun
    let description = 'Sem descrição';
    if (storageKey || body?.['message-url']) {
      const url = `https://storage-us-west1.api.mailgun.net/v3/domains/mail.atosticket.com/messages/${storageKey}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`,
          Accept: 'message/rfc2822',
        },
      });
      const data = await response.json();
      description = data?.['body-plain'] || data?.['stripped-text'] || 'Sem descrição';
    }

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
