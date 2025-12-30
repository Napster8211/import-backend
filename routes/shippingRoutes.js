const express = require('express');
const router = express.Router();
const { protect, admin, authorize, PERMISSIONS } = require('../middleware/authMiddleware');
const { 
  getShippingConfig, 
  updateShippingConfig, 
  getShippingLogs 
} = require('../controllers/shippingConfigController');

// 🟢 1. VIEW CONFIG
// Requires: 'view_shipping_rates'
// (Allowed: Operations, Finance, Super Admin)
router.get('/config', 
  protect, 
  admin, 
  authorize(PERMISSIONS.VIEW_SHIPPING_RATES), 
  getShippingConfig
);

// 🟢 2. EDIT CONFIG
// Requires: 'manage_shipping_rates'
// (Allowed: Finance, Super Admin)
router.put('/config', 
  protect, 
  admin, 
  authorize(PERMISSIONS.MANAGE_SHIPPING_RATES), 
  updateShippingConfig
);

// 🟢 3. VIEW AUDIT LOGS
// Requires: 'view_audit_logs'
// (Allowed: Super Admin Only - defined in authMiddleware)
router.get('/logs', 
  protect, 
  admin, 
  authorize(PERMISSIONS.VIEW_AUDIT_LOGS), 
  getShippingLogs
);

module.exports = router;