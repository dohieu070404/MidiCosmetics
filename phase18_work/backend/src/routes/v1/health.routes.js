import { Router } from 'express';
import { healthController } from '../../modules/health/health.controller.js';

const router = Router();

router.get('/', healthController.ready);
router.get('/live', healthController.live);
router.get('/ready', healthController.ready);

export default router;
