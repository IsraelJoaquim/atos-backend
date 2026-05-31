import { inboundEmailWebhook } from '../controllers/webhookController.js';

export default function webhookRoutes(app) {
  app.post('/webhook/email', inboundEmailWebhook);
}
