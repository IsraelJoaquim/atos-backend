import prisma from '../../lib/prisma.js';
import { createTicket } from '../services/ticketService.js';
import { Resend } from 'resend';
import busboy from 'busboy';

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend inbound
export async function inboundEmailWebhook(req, reply) {
  try {
    const body = req.body || {};
    let fromEmail, title, description = 'Sem descrição';

    if (body?.type === 'email.received' && body?.data) {
      fromEmail = body.data.from?.toLowerCase();
      title = body.data.subject || 'Sem assunto';
    } else {
      fromEmail = (body?.sender || body?.from || '')
        .replace(/.*<(.+)>/, '$1').toLowerCase().trim();
      title = body?.subject || 'Sem assunto';
      description = body?.['body-plain'] || body?.['stripped-text'] || 'Sem descrição';
    }

    console.log('[WEBHOOK] From:', fromEmail, 'Title:', title);

    if (!fromEmail) return reply.status(400).send({ error: 'Remetente não encontrado.' });

    const user = await prisma.users.findUnique({ where: { email: fromEmail } });
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

// Mailgun inbound
export async function inboundMailgunWebhook(req, reply) {
  try {
    const fields = await new Promise((resolve, reject) => {
      const bb = busboy({ headers: req.raw.headers });
      const result = {};
      bb.on('field', (name, val) => { result[name] = val; });
      bb.on('finish', () => resolve(result));
      bb.on('error', reject);
      req.raw.pipe(bb);
    });

    console.log('[MAILGUN] Fields:', JSON.stringify(fields));

    const fromEmail = (fields?.sender || fields?.from || '')
      .replace(/.*<(.+)>/, '$1').toLowerCase().trim();
    const title = fields?.subject || 'Sem assunto';
    const description = fields?.['body-plain'] || fields?.['stripped-text'] || 'Sem descrição';

    if (!fromEmail) return reply.status(400).send({ error: 'Remetente não encontrado.' });

    const user = await prisma.users.findUnique({ where: { email: fromEmail } });
    if (!user || !user.active || !user.email_verified) {
      return reply.status(404).send({ error: 'Usuário não encontrado ou inativo.' });
    }

    const ticket = await createTicket({
      title: title.substring(0, 100),
      description: description.substring(0, 1000),
      userId: user.id,
      tenantId: user.tenantId,
    });

    console.log(`[MAILGUN] Chamado criado: ${ticket.ticket} — ${fromEmail}`);
    return reply.status(200).send({ ticket: ticket.ticket });
  } catch (error) {
    console.error('[MAILGUN] Erro:', error.message);
    return reply.status(500).send({ error: 'Erro interno.' });
  }
}
