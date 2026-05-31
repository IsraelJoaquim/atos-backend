import fastifyCors from '@fastify/cors';
import { fastify } from 'fastify';
import fastifyMultipart from '@fastify/multipart';


import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import tenantRoutes from './routes/tenantRoutes.js';
import webhookRoute from './routes/webhookRoute.js';

const server = fastify();

server.addHook('onRequest', (request, response, done) => {

  // ignora o webhook
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
server.register(fastifyMultipart)
// server.register(webhookRoute);

server.get('/', async (_, response) => {
  return response.status(200).send('API ATOS rodando!');
});

export { server };
