import prisma from '../../lib/prisma.js';

export function genTck() {
  const chars = 'BCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let random = '';
  for (let i = 0; i < 5; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TCK-${random}`;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createTicket({ title, description, userId, tenantId }) {
  const tck = genTck();
  const ticket = await prisma.chamados.create({
    data: {
      title,
      description,
      userId,
      tenantId,
      status: 'aberto',
      ticket: tck,
    },
    include: {
      user: { select: { name: true } },
      movimentacoes: true,
    },
  });
  return ticket;
}

// ─── READ ─────────────────────────────────────────────────────────────────────

export async function getTickets({ tenantId, userId, role }) {
  // usuario só vê os próprios chamados; tecnico e admin veem todos do tenant
  const where = role === 'usuario'
    ? { tenantId, userId }
    : { tenantId };

  const tickets = await prisma.chamados.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      movimentacoes: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return tickets || [];
}

export async function getTicketById(ticketId, tenantId, userId, role) {
  const ticket = await prisma.chamados.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { id: true, name: true, email:true } },
      movimentacoes: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!ticket || ticket.tenantId !== tenantId) return null;

  // usuario só pode ver o próprio chamado
  if (role === 'usuario' && ticket.userId !== userId) return null;

  return ticket;
}

// ─── UPDATE CONTENT (usuario) ─────────────────────────────────────────────────

export async function updateTicketContent({ ticketId, userId, tenantId, title, description }) {
  const ticket = await prisma.chamados.findUnique({ where: { id: ticketId } });

  if (!ticket || ticket.tenantId !== tenantId) throw new Error('Chamado não encontrado.');
  if (ticket.userId !== userId) throw new Error('Você não tem permissão para editar este chamado.');
  if (ticket.status !== 'aberto') throw new Error('Só é possível editar chamados em aberto.');

  return prisma.chamados.update({
    where: { id: ticketId },
    data: { title, description },
  });
}

// ─── UPDATE STATUS (tecnico) ──────────────────────────────────────────────────

export async function updateTicketStatus({
  ticketId,
  tenantId,
  tecnicoId,
  tecnicoNome,
  novoStatus,
  observacao,
}) {
  const ticket = await prisma.chamados.findUnique({ where: { id: ticketId } });

  if (!ticket || ticket.tenantId !== tenantId) throw new Error('Chamado não encontrado.');
  if (ticket.status === 'finalizado') throw new Error('Este chamado já foi finalizado.');

  const statusAntes = ticket.status;

  // atualiza chamado e registra movimentação em transação
  const [updated] = await prisma.$transaction([
    prisma.chamados.update({
      where: { id: ticketId },
      data: {
        status: novoStatus,
        assignedToId: tecnicoId,
        assignedToName: tecnicoNome,
      },
      include: {
        user: { select: { id: true, name: true } },
        movimentacoes: { orderBy: { createdAt: 'asc' } },
      },
    }),
    prisma.movimentacoes.create({
      data: {
        ticketId,
        tecnicoId,
        tecnicoNome,
        statusAntes,
        statusDepois: novoStatus,
        observacao: observacao || null,
      },
    }),
  ]);

  return updated;
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteTicket(ticketId, tenantId) {
  const ticket = await prisma.chamados.findUnique({ where: { id: ticketId } });

  if (!ticket || ticket.tenantId !== tenantId) throw new Error('Chamado não encontrado.');

  await prisma.chamados.delete({ where: { id: ticketId } });
}
