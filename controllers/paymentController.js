const Order = require('../models/Order');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// 🟢 HARDCODED CONFIGURATION (Guaranteed to work)
// 1. Your Render Backend URL (Where Moolre sends the webhook confirmation)
const BACKEND_URL = 'https://import-backend-7cfn.onrender.com';

// 2. Your Vercel Frontend URL (Where users go after payment)
// ✅ Updated to your specific URL
const FRONTEND_URL = 'https://napsterimports.vercel.app'; 

// @desc    Create Payment Link (Redirect Flow)
// @route   POST /api/payment/create
// @access  Private
exports.createPaymentLink = async (req, res) => {
  const { orderId, amount, userEmail } = req.body;

  console.log("------------------------------------------------");
  console.log("🐞 DEBUG: Starting Payment Initiation");
  
  // 1. Validate Keys
  if (!process.env.MOOLRE_SECRET_KEY) {
    console.error("❌ CRITICAL: MOOLRE_SECRET_KEY is missing from .env!");
    return res.status(500).json({ message: 'Server Config Error: Missing API Key' });
  }

  try {
    // 2. Check Order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // 🟢 3. Construct Valid URLs
    // We use the hardcoded strings to ensure they are never "undefined"
    const finalRedirectUrl = `${FRONTEND_URL}/orders/${orderId}`;
    const finalCallbackUrl = `${BACKEND_URL}/api/payment/webhook`;

    console.log("🔗 Redirect URL:", finalRedirectUrl);
    console.log("🔗 Callback URL:", finalCallbackUrl);

    // 4. Prepare Payload for Moolre
    const payload = {
      amount: amount,
      currency: "GHS",
      customer_email: userEmail,
      client_reference: orderId.toString(),
      description: `Order #${orderId}`,
      redirect_url: finalRedirectUrl,
      callback_url: finalCallbackUrl
    };

    console.log("🚀 Sending Payload to Moolre...");

    // 5. Call Moolre API
    const moolreResponse = await axios.post('https://api.moolre.com/v1/checkout/initiate', payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.MOOLRE_SECRET_KEY
      }
    });

    console.log("✅ Moolre Success:", moolreResponse.data);

    // 6. Return the URL to Frontend
    if (moolreResponse.data && moolreResponse.data.checkout_url) {
      return res.status(200).json({
        status: 'success',
        url: moolreResponse.data.checkout_url
      });
    } else {
      throw new Error("No checkout_url in response");
    }

  } catch (error) {
    console.error("❌ PAYMENT FAILED");
    const errorData = error.response ? error.response.data : error.message;
    console.error("🔴 Moolre Error Data:", JSON.stringify(errorData, null, 2));
    
    res.status(500).json({ 
      message: 'Payment Initiation Failed', 
      detail: errorData 
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
      console.log(`✅ Order ${client_reference} Paid!`);
    }
    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Server Error');
  }
};