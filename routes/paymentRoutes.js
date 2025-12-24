const express = require('express');
const router = express.Router();
const { initiatePayment, handleWebhook } = require('../controllers/paymentController');

router.post('/initiate', initiatePayment);
router.post('/webhook', handleWebhook);

module.exports = router;