const Order = require('../models/Order');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// @desc    Create Payment Link (Redirect Flow)
// @route   POST /api/payment/create
// @access  Private
exports.createPaymentLink = async (req, res) => {
  // 🟢 1. Accept the data the Frontend is actually sending
  const { orderId, amount, userEmail } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // 🟢 2. Call Moolre to Initialize Checkout
    // NOTE: Check Moolre Docs for the exact "Initialize" URL. 
    // It is usually '/v1/checkout/initiate' or '/v1/transaction/initialize'
    // I am using a standard structure here.
    const moolreResponse = await axios.post('https://api.moolre.com/v1/checkout/initiate', {
      amount: amount, 
      currency: "GHS",
      customer_email: userEmail,
      client_reference: orderId, // We send the Order ID as reference
      description: `Payment for Order #${orderId}`,
      // The URL Moolre should redirect back to after payment
      redirect_url: `${process.env.BASE_URL || 'https://your-frontend-url.com'}/orders/${orderId}`,
      callback_url: `${process.env.BACKEND_URL}/api/payment/webhook` // For server updates
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.MOOLRE_SECRET_KEY}`, // Check if they use 'Bearer' or 'X-API-KEY'
        'Content-Type': 'application/json'
      }
    });

    // 🟢 3. Return the URL to the Frontend
    // The frontend expects { status: 'success', url: '...' }
    if (moolreResponse.data && moolreResponse.data.checkout_url) {
      res.status(200).json({
        status: 'success',
        url: moolreResponse.data.checkout_url 
      });
    } else {
      console.error("Moolre Response:", moolreResponse.data);
      res.status(400).json({ message: 'Could not generate payment link' });
    }

  } catch (error) {
    console.error("Payment Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ 
      message: 'Payment Initiation Failed', 
      detail: error.response?.data?.message || error.message 
    });
  }
};

// @desc    Moolre Webhook
// @route   POST /api/payment/webhook
exports.handleWebhook = async (req, res) => {
  // Use the exact logic from before, but simplified for "Total Payment"
  const { client_reference, status, transaction_id } = req.body;

  if (status !== 'SUCCESS') return res.status(200).send('OK');

  try {
    const orderId = client_reference;
    const order = await Order.findById(orderId);

    if (order) {
      // Mark everything as paid
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: transaction_id,
        status: status,
        update_time: Date.now(),
        email_address: req.body.customer_email,
      };
      
      // Also mark sub-statuses if you use them
      order.isItemPaid = true;
      order.isShippingPaid = true; 
      
      await order.save();
      console.log(`✅ Order ${orderId} marked as PAID via Webhook`);
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Server Error');
  }
};