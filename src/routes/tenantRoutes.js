import {
  createTenantController,
  getTenantsController,
  getTenantByIdController,
} from '../controllers/tenantController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

export default function tenantRoutes(app) {
  // criar tenant é público — necessário para o primeiro cadastro de uma empresa
  app.post('/tenants', createTenantController);

  // listar e buscar exigem autenticação
  app.get('/tenants',     { preHandler: authenticateToken }, getTenantsController);
  app.get('/tenants/:id', { preHandler: authenticateToken }, getTenantByIdController);
}
