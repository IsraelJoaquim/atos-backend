import { inboundEmailWebhook } from '../controllers/webhookController.js';

export default function webhookRoute(app) {
  app.post('/webhook/email', inboundEmailWebhook);
}
