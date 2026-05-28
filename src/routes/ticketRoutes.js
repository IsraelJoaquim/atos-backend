import {
  createTicketController,
  deleteTicketController,
  getTicketByIdController,
  getTicketsController,
  updateTicketContentController,
  updateTicketStatusController,
} from '../controllers/ticketController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

export default function ticketRoutes(app) {
  app.post('/tickets',                      { preHandler: authenticateToken }, createTicketController);
  app.get('/tickets',                       { preHandler: authenticateToken }, getTicketsController);
  app.get('/tickets/:id',                   { preHandler: authenticateToken }, getTicketByIdController);
  app.put('/tickets/:id/status',            { preHandler: authenticateToken }, updateTicketStatusController);
  app.put('/tickets/:id/content',           { preHandler: authenticateToken }, updateTicketContentController);
  app.delete('/tickets/:id',                { preHandler: authenticateToken }, deleteTicketController);
}
