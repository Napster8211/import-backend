const Order = require('../models/Order');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// @desc    Create Payment Link (Redirect Flow)
// @route   POST /api/payment/create
// @access  Private
exports.createPaymentLink = async (req, res) => {
  const { orderId, amount, userEmail } = req.body;

  // 1. Validate Keys exist before trying
  if (!process.env.MOOLRE_SECRET_KEY || !process.env.MOOLRE_PUBLIC_KEY) {
    console.error("❌ MISSING KEYS: MOOLRE_SECRET_KEY or MOOLRE_PUBLIC_KEY not found.");
    return res.status(500).json({ message: 'Server Payment Configuration Error' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    console.log(`🔄 Initiating Moolre Payment for Order ${orderId}...`);

    // 2. Call Moolre API
    // DOCUMENTATION NOTE: Moolre typically uses 'X-API-KEY' for authentication.
    const moolreResponse = await axios.post('https://api.moolre.com/v1/checkout/initiate', {
      amount: amount,
      currency: "GHS",
      customer_email: userEmail,
      client_reference: orderId.toString(),
      description: `Order #${orderId}`,
      // Redirect back to your frontend "Order Details" page after payment
      redirect_url: `https://your-frontend-domain.com/orders/${orderId}`, 
      callback_url: `${process.env.BACKEND_URL}/api/payment/webhook`
    }, {
      headers: {
        'Content-Type': 'application/json',
        // 🟢 FIX: Use the correct Auth Headers for Moolre
        'X-API-KEY': process.env.MOOLRE_SECRET_KEY, 
        'X-API-PUBKEY': process.env.MOOLRE_PUBLIC_KEY // Include if you have it, otherwise remove
      }
    });

    console.log("✅ Moolre Response:", moolreResponse.data);

    // 3. Handle Success
    if (moolreResponse.data && moolreResponse.data.checkout_url) {
      res.status(200).json({
        status: 'success',
        url: moolreResponse.data.checkout_url
      });
    } else {
      console.error("❌ Moolre did not return a URL:", moolreResponse.data);
      res.status(400).json({ message: 'Payment provider did not return a checkout link.' });
    }

  } catch (error) {
    // 🟢 ROBUST ERROR LOGGING
    // This will print the EXACT message Moolre sent back (e.g., "Invalid Key", "Amount too low")
    const errorMsg = error.response ? error.response.data : error.message;
    console.error("❌ PAY MENT FAILED:", JSON.stringify(errorMsg, null, 2));
    
    res.status(500).json({ 
      message: 'Payment Initiation Failed', 
      detail: errorMsg 
    });
  }
};

// @desc    Moolre Webhook
// @route   POST /api/payment/webhook
exports.handleWebhook = async (req, res) => {
  const { client_reference, status, transaction_id } = req.body;

  if (status !== 'SUCCESS') return res.status(200).send('OK');

  try {
    const order = await Order.findById(client_reference);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: transaction_id,
        status: status,
        email_address: req.body.customer_email,
      };
      await order.save();
      console.log(`✅ Webhook: Order ${client_reference} Paid!`);
    }
    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Server Error');
  }
};