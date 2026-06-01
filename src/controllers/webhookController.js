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
