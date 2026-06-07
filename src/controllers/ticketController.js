import {
  createTicket,
  deleteTicket,
  getTicketById,
  getTickets,
  updateTicketContent,
  updateTicketStatus,
} from '../services/ticketService.js';

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createTicketController(req, reply) {
  try {
    const { title, description } = req.body;
    const { id: userId, tenantId } = req.user;

    if (!title || !description) {
      return reply
        .status(400)
        .send({ error: 'Título e descrição são obrigatórios.' });
    }

    const ticket = await createTicket({ title, description, userId, tenantId });
    return reply.status(201).send({ message: 'Chamado criado!', ticket });
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
}

// ─── READ ─────────────────────────────────────────────────────────────────────

export async function getTicketsController(req, reply) {
  try {
    const { id: userId, tenantId, role } = req.user;
    const tickets = await getTickets({ tenantId, userId, role });
    return reply.send(tickets);
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

export async function getTicketByIdController(req, reply) {
  try {
    const { id: userId, tenantId, role } = req.user;
    const ticket = await getTicketById(req.params.id, tenantId, userId, role);
    if (!ticket)
      return reply.status(404).send({ error: 'Chamado não encontrado.' });
    return reply.send(ticket);
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

// ─── UPDATE CONTENT (usuario) ─────────────────────────────────────────────────

export async function updateTicketContentController(req, reply) {
  try {
    if (req.user.role !== 'usuario') {
      return reply.status(403).send({ error: 'Acesso negado.' });
    }

    const { title, description } = req.body;
    const { id: userId, tenantId } = req.user;

    if (!title || !description) {
      return reply
        .status(400)
        .send({ error: 'Título e descrição são obrigatórios.' });
    }

    const ticket = await updateTicketContent({
      ticketId: req.params.id,
      userId,
      tenantId,
      title,
      description,
    });

    return reply.send({ message: 'Chamado atualizado!', ticket });
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
}

// ─── UPDATE STATUS (atendente) ──────────────────────────────────────────────────

export async function updateTicketStatusController(req, reply) {
  try {
    if (req.user.role !== 'atendente' && req.user.role !== 'admin') {
      return reply.status(403).send({ error: 'Acesso negado.' });
    }

    const { status, observacao } = req.body;
    const { id: atendenteId, name: atendenteNome, tenantId } = req.user;

    if (!status) {
      return reply.status(400).send({ error: 'Status é obrigatório.' });
    }

    const validStatus = ['aberto', 'em_andamento', 'finalizado'];
    if (!validStatus.includes(status)) {
      return reply.status(400).send({ error: 'Status inválido.' });
    }

    const ticket = await updateTicketStatus({
      ticketId: req.params.id,
      tenantId,
      atendenteId,
      atendenteNome,
      novoStatus: status,
      observacao,
    });

    return reply.send({ message: 'Status atualizado!', ticket });
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteTicketController(req, reply) {
  try {
    if (req.user.role !== 'admin') {
      return reply
        .status(403)
        .send({ error: 'Apenas administradores podem deletar chamados.' });
    }

    await deleteTicket(req.params.id, req.user.tenantId);
    return reply.send({ message: 'Chamado deletado!' });
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
}
