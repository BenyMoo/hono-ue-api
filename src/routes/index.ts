import { Hono } from 'hono';
import type { HonoEnv } from '../types';

// Import route modules
import auth from './auth';
import checkin from './checkin';
import membership from './membership';
import stats from './stats';

// Create main router
const router = new Hono<HonoEnv>();

// Mount routes with proper prefixes
router.route('/auth', auth);
router.route('/checkin', checkin);
router.route('/membership', membership);
router.route('/stats', stats);

export default router;