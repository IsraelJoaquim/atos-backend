import prisma from '../../lib/prisma.js';
import { createTicket } from '../services/ticketService.js';
import { Resend } from 'resend';

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
    const body = req.body || {};
    console.log('[MAILGUN] Body:', JSON.stringify(body));

    const storageUrl = body?.['message-url'];
    const fromEmail = (body?.sender || body?.from || '')
      .replace(/.*<(.+)>/, '$1').toLowerCase().trim();
    const title = body?.subject || 'Sem assunto';

    let description = 'Sem descrição';
    if (storageUrl) {
      const response = await fetch(storageUrl, {
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`,
        },
      });
      const data = await response.json();
      console.log('[MAILGUN] Email data:', JSON.stringify(data));
      description = data?.['body-plain'] || data?.['stripped-text'] || 'Sem descrição';
    }

    if (!fromEm
