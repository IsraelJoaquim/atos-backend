import {
  forgotPasswordController,
  resetPasswordController,
} from '../controllers/passwordController.js';

export default function passwordRoutes(app) {
  app.post('/forgot-password', forgotPasswordController);
  app.post('/reset-password',  resetPasswordController);
}
