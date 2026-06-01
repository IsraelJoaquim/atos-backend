import { inboundEmailWebhook, inboundMailgunWebhook } from '../controllers/webhookController.js';

export default function webhookRoute(app) {
  app.post('/webhook/email', inboundEmailWebhook);
  app.post('/webhook/mailgun', {
    config: { rawBody: true }
  }, inboundMailgunWebhook);
}
