import { Router } from 'express';
import { getPaths, getPathDetails, enrollInPath } from '../controllers/pathController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticateToken);

router.get('/', getPaths);
router.get('/:pathId', getPathDetails);
router.post('/:pathId/enroll', enrollInPath);

export default router;
