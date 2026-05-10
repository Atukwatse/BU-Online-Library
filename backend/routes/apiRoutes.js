/**
 * Main API Router
 * Handles API versioning
 */

const express = require('express');
const router = express.Router();

const v1Routes = require('./v1');
const v2Routes = require('./v2');

// Mount versioned routes
router.use('/v1', v1Routes);
router.use('/v2', v2Routes);

// Default to v2
router.use('/', v2Routes);

// API documentation
const { serve, setup } = require('../middleware/swaggerMiddleware');
router.use('/docs', serve, setup);

module.exports = router;
