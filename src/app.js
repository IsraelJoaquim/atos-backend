import fastifyCors from '@fastify/cors';
import { fastify } from 'fastify';
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import tenantRoutes from './routes/tenantRoutes.js';
import webhookRoute from './routes/webhookRoute.js';

const server = fastify();

server.addContentTypeParser('multipart/form-data', { parseAs: 'string' }, (req, body, done) => {
  done(null, body);
});

server.addHook('onRequest', (request, response, done) => {
  if (request.url === '/webhook/email') {
    return done();
  }
  const contentType = request.headers['content-type'];
  if (contentType !== 'application/json') {
    response.header('content-type', 'application/json');
  }
  done();
});

server.register(fastifyCors, {
  origin: '*',
  allowedHeaders: ['Content-Type', 'Authorization'],
});
server.register(authRoutes);
server.register(ticketRoutes);
server.register(tenantRoutes);
server.register(webhookRoute);

server.get('/', async (_, response) => {
  return response.status(200).send('API ATOS rodando!');
});

export { server };
