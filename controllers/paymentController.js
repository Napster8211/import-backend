const Order = require('../models/Order');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// @desc    Create Payment Link (DEBUG VERSION)
// @route   POST /api/payment/create
// @access  Private
exports.createPaymentLink = async (req, res) => {
  const { orderId, amount, userEmail } = req.body;

  console.log("------------------------------------------------");
  console.log("🐞 DEBUG: Starting Payment Initiation");
  console.log(`📝 Order ID: ${orderId}`);
  console.log(`💰 Amount: ${amount}`);
  console.log(`📧 Email: ${userEmail}`);
  
  // 1. Check API Keys
  if (!process.env.MOOLRE_SECRET_KEY) {
    console.error("❌ CRITICAL ERROR: MOOLRE_SECRET_KEY is missing from .env!");
    return res.status(500).json({ message: 'Server Config Error: Missing API Key' });
  } else {
    console.log("✅ API Key found (ends with):", process.env.MOOLRE_SECRET_KEY.slice(-4));
  }

  try {
    // 2. Check Order in DB
    const order = await Order.findById(orderId);
    if (!order) {
      console.error("❌ ERROR: Order not found in database.");
      return res.status(404).json({ message: 'Order not found' });
    }
    console.log("✅ Order found in DB.");

    // 3. Prepare Moolre Payload
    const payload = {
      amount: amount,
      currency: "GHS",
      customer_email: userEmail,
      client_reference: orderId.toString(),
      description: `Order #${orderId}`,
      redirect_url: `https://napsterimports.vercel.app/orders/${orderId}`, // Update this domain if needed!
      callback_url: `${process.env.BACKEND_URL || 'https://import-backend-7cfn.onrender.com'}/api/payment/webhook`
    };
    
    console.log("🚀 Sending Payload to Moolre:", JSON.stringify(payload, null, 2));

    // 4. Call Moolre API
    // We try both the 'checkout/initiate' and 'payments' endpoints just in case
    // For now, let's stick to the standard checkout initiation
    const moolreResponse = await axios.post('https://api.moolre.com/v1/checkout/initiate', payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.MOOLRE_SECRET_KEY
      }
    });

    console.log("✅ Moolre Response Status:", moolreResponse.status);
    console.log("✅ Moolre Response Data:", JSON.stringify(moolreResponse.data, null, 2));

    // 5. Handle Success
    if (moolreResponse.data && moolreResponse.data.checkout_url) {
      return res.status(200).json({
        status: 'success',
        url: moolreResponse.data.checkout_url
      });
    } else {
      console.error("❌ ERROR: Moolre did not return a 'checkout_url'.");
      return res.status(400).json({ message: 'Payment provider response invalid', details: moolreResponse.data });
    }

  } catch (error) {
    console.log("------------------------------------------------");
    console.error("❌ PAYMENT REQUEST FAILED");
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("🔴 Status Code:", error.response.status);
      console.error("🔴 Error Data:", JSON.stringify(error.response.data, null, 2));
      
      return res.status(error.response.status).json({ 
        message: 'Payment Gateway Error', 
        detail: error.response.data 
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error("🔴 No Response Received (Network Error)");
      return res.status(503).json({ message: 'Network Error: Could not reach Payment Gateway' });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("🔴 Request Setup Error:", error.message);
      return res.status(500).json({ message: 'Internal Server Error', detail: error.message });
    }
  }
};

// @desc    Moolre Webhook
// @route   POST /api/payment/webhook
exports.handleWebhook = async (req, res) => {
  console.log("🔔 Webhook Received:", req.body);
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
      console.log(`✅ Order ${client_reference} marked as PAID.`);
    }
    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Server Error');
  }
};