const express = require('express');
const router = express.Router();

// 1. Import Controllers
const {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  updateOrderStatus,
} = require('../controllers/orderController');

// 2. Import Middleware & Permissions
const { protect, authorize, PERMISSIONS } = require('../middleware/authMiddleware');

// 3. Define Routes

// --- PUBLIC / CUSTOMER ROUTES ---
// Any logged-in user can create an order or see "My Orders"
router.route('/').post(protect, addOrderItems);
router.route('/myorders').get(protect, getMyOrders);

// --- 🔒 STAFF RESTRICTED ROUTES ---

// 1. View All Orders
// Allowed: Support, Operations, Finance, Super Admin
router.route('/').get(
  protect, 
  authorize(PERMISSIONS.VIEW_ORDERS), 
  getOrders
);

// 2. Get Single Order
// Note: We do NOT add strict permission middleware here because 
// regular customers need to access this too (if they own the order).
// The Controller logic handles the "Owner vs Admin" check.
router.route('/:id').get(protect, getOrderById);

// 3. Pay Order
// Allowed: Finance Only
router.route('/:id/pay').put(
  protect, 
  authorize(PERMISSIONS.CONFIRM_PAYMENTS), 
  updateOrderToPaid
);

// 4. Mark as Delivered
// Allowed: Operations Only
router.route('/:id/deliver').put(
  protect, 
  authorize(PERMISSIONS.UPDATE_ORDER_STATUS), 
  updateOrderToDelivered
);

// 5. Update Custom Status (Processing -> Shipped)
// Allowed: Operations Only
router.route('/:id/status').put(
  protect, 
  authorize(PERMISSIONS.UPDATE_ORDER_STATUS), 
  updateOrderStatus
);

module.exports = router;