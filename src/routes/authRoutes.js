import {
  userRegister,
  userLogin,
  userSoftDelete,
  confirmEmail,
  getUsersController,
} from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

export default function authRoutes(app) {
  app.post('/register',     userRegister);
  app.post('/confirm-email', confirmEmail);
  app.post('/login',        userLogin);
  app.get('/users',         { preHandler: authenticateToken }, getUsersController);
  app.delete('/users/:id',  { preHandler: authenticateToken }, userSoftDelete);
}
