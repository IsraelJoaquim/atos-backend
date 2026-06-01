import { inboundEmailWebhook, inboundMailgunWebhook, inboundCloudmailinWebhook } from '../controllers/webhookController.js';


export default function webhookRoute(app) {
  app.post('/webhook/email', inboundEmailWebhook);
  app.post('/webhook/mailgun', inboundMailgunWebhook);
  app.post('/webhook/cloudmailin', inboundCloudmailinWebhook);
}
