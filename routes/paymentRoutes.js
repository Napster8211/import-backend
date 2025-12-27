const express = require('express');
const router = express.Router();
// 🟢 Import the specific functions we created in the controller
const { createPaymentLink, handleWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// @desc    Initialize Payment (Frontend calls this)
// @route   POST /api/payment/create
// @access  Private
router.post('/create', protect, createPaymentLink);

// @desc    Moolre Webhook (Moolre calls this)
// @route   POST /api/payment/webhook
// @access  Public
router.post('/webhook', handleWebhook);

module.exports = router;