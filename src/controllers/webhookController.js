import prisma from '../../lib/prisma.js';
import { createTicket } from '../services/ticketService.js';
import { Resend } from 'resend';
import { Readable } from 'stream';


const resend = new Resend(process.env.RESEND_API_KEY);

// Resend inbound
export async function inboundMailgunWebhook(req, reply) {
try {
    const fields = await new Promise((resolve, reject) => {
      const bb = busboy({ headers: req.headers });
      const result = {};
      bb.on('field', (name, val) => { result[name] = val; });
      bb.on('finish', () => resolve(result));
      bb.on('error', reject);

      const { Readable } = await import('stream');
      Readable.from(req.body).pipe(bb);
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
