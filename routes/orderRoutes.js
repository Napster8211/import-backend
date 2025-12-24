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
  updateOrderStatus, // ⬅️ Must match controller export
} = require('../controllers/orderController');

// 2. Import Middleware
const { protect, authorize } = require('../middleware/authMiddleware');

// 3. Define Routes

// Public / Customer Routes
router.route('/').post(protect, addOrderItems);
router.route('/myorders').get(protect, getMyOrders);

// 🔒 RESTRICTED ROUTES (Admin / Operations / Finance)

// View All Orders (Operations & Above)
router.route('/').get(
  protect, 
  authorize('view_orders'), 
  getOrders
);

// Get Single Order (Anyone with ID, but frontend protects visibility)
router.route('/:id').get(protect, getOrderById);

// Pay Order (Finance Only)
router.route('/:id/pay').put(
  protect, 
  authorize('confirm_payments'), 
  updateOrderToPaid
);

// Mark as Delivered (Operations Only)
router.route('/:id/deliver').put(
  protect, 
  authorize('update_order_status'), 
  updateOrderToDelivered
);

// Update Custom Status (Processing -> Shipped) (Operations Only)
router.route('/:id/status').put(
  protect, 
  authorize('update_order_status'), 
  updateOrderStatus
);

module.exports = router;