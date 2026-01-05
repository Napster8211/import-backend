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
  getDashboardStats, // 🟢 NEW: Don't forget to import this!
} = require('../controllers/orderController');

// 2. Import Middleware & Permissions
const { protect, authorize, PERMISSIONS } = require('../middleware/authMiddleware');

// 3. Define Routes

// --- PUBLIC / CUSTOMER ROUTES ---
router.route('/').post(protect, addOrderItems);
router.route('/myorders').get(protect, getMyOrders);

// --- 🔒 STAFF RESTRICTED ROUTES ---

// 🟢 NEW: REPORTS ROUTE (Must be ABOVE /:id)
// Allowed: Finance, Admin, Viewer
router.route('/summary').get(
  protect, 
  authorize(PERMISSIONS.VIEW_REPORTS), 
  getDashboardStats
);

// 1. View All Orders (The "Payment History" List)
// Allowed: Support, Operations, Finance, Super Admin
router.route('/').get(
  protect, 
  authorize(PERMISSIONS.VIEW_ORDERS), 
  getOrders
);

// 2. Get Single Order
router.route('/:id').get(protect, getOrderById);

// 3. Pay Order
router.route('/:id/pay').put(
  protect, 
  authorize(PERMISSIONS.CONFIRM_PAYMENTS), 
  updateOrderToPaid
);

// 4. Mark as Delivered
router.route('/:id/deliver').put(
  protect, 
  authorize(PERMISSIONS.UPDATE_ORDER_STATUS), 
  updateOrderToDelivered
);

// 5. Update Custom Status
router.route('/:id/status').put(
  protect, 
  authorize(PERMISSIONS.UPDATE_ORDER_STATUS), 
  updateOrderStatus
);

module.exports = router;