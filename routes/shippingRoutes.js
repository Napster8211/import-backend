const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getShippingConfig, updateShippingConfig } = require('../controllers/shippingConfigController');

// All shipping config routes are protected and for admins only
router.route('/config')
  .get(protect, admin, getShippingConfig)
  .put(protect, admin, updateShippingConfig);

module.exports = router;