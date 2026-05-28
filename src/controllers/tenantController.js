import { createTenant, getTenants, getTenantById } from '../services/tenantService.js';

export async function createTenantController(req, reply) {
  try {
    const { name } = req.body;
    const tenant = await createTenant(name);
    return reply.status(201).send({ message: 'Empresa criada!', tenant });
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
}

export async function getTenantsController(req, reply) {
  try {
    const tenants = await getTenants();
    return reply.send(tenants);
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
}

export async function getTenantByIdController(req, reply) {
  try {
    const tenant = await getTenantById(req.params.id);
    return reply.send(tenant);
  } catch (error) {
    return reply.status(404).send({ error: error.message });
  }
}
