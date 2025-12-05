import { Hono } from 'hono';
import type { HonoEnv } from '../types';

// Import route modules
import auth from './auth';
import checkin from './checkin';
import membership from './membership';

// Create main router
const router = new Hono<HonoEnv>();

// Mount routes with proper prefixes
router.route('/auth', auth);
router.route('/checkin', checkin);
router.route('/membership', membership);

export default router;