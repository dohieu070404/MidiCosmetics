import { Router } from 'express';
import { authRateLimiter } from '../../middlewares/rate-limiter.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { USER_ROLES } from '../../constants/roles.js';
import { authController } from '../../modules/auth/auth.controller.js';
import { loginSchema, logoutSchema, refreshTokenSchema } from '../../modules/auth/auth.validation.js';

const router = Router();

router.post('/register', authController.registerDisabled);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authRateLimiter, validate(refreshTokenSchema), authController.refresh);
router.post('/logout', validate(logoutSchema), authController.logout);
router.get('/me', authenticate, authorize(USER_ROLES.ADMIN), authController.me);

export default router;
