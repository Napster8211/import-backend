const Order = require('../models/Order');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// 🟢 HARDCODED CONFIGURATION
const BACKEND_URL = 'https://import-backend-7cfn.onrender.com';
const FRONTEND_URL = 'https://napsterimports.vercel.app'; 

exports.createPaymentLink = async (req, res) => {
  const { orderId, amount, userEmail } = req.body;

  console.log("------------------------------------------------");
  console.log("🐞 DEBUG: Starting Moolre Payment Link Generation");

  // 1. Validate NEW Required Keys
  if (!process.env.MOOLRE_PUBKEY || !process.env.MOOLRE_USER || !process.env.MOOLRE_ACC_NUM) {
    console.error("❌ CRITICAL: Missing Moolre Config!");
    console.error("Required: MOOLRE_PUBKEY, MOOLRE_USER, MOOLRE_ACC_NUM");
    return res.status(500).json({ message: 'Server Config Error: Missing Moolre Keys' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // 2. Prepare Payload (Docs Page 26)
    // URL: https://api.moolre.com/embed/link
    const payload = {
      type: 1, // Required by Moolre
      amount: amount, // Amount in Decimals (e.g., 15.00)
      currency: "GHS",
      email: userEmail,
      reusable: 0, // 0 = One-time payment
      externalref: orderId.toString(), // Unique ID
      callback: `${BACKEND_URL}/api/payment/webhook`,
      redirect: `${FRONTEND_URL}/orders/${orderId}`, // Where user goes after payment
      accountnumber: process.env.MOOLRE_ACC_NUM // <--- REQUIRED from Docs
    };

    console.log("🚀 Sending Payload to Moolre:", JSON.stringify(payload, null, 2));

    // 3. Call Moolre API
    const moolreResponse = await axios.post('https://api.moolre.com/embed/link', payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-USER': process.env.MOOLRE_USER,    // <--- Your Moolre Username
        'X-API-PUBKEY': process.env.MOOLRE_PUBKEY // <--- Your PUBLIC Key
      }
    });

    console.log("✅ Moolre Success:", moolreResponse.data);

    // 4. Handle Response
    // Docs Page 26: Response contains "authorization_url"
    if (moolreResponse.data && moolreResponse.data.data && moolreResponse.data.data.authorization_url) {
      return res.status(200).json({
        status: 'success',
        url: moolreResponse.data.data.authorization_url
      });
    } else {
      console.error("❌ No authorization_url found:", moolreResponse.data);
      throw new Error("Invalid response from payment provider");
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

exports.handleWebhook = async (req, res) => {
  // Docs Page 29: Webhook format
  const { status, message, data } = req.body;

  // status 1 means Successful [cite: 549]
  if (status !== 1) return res.status(200).send('OK');

  try {
    // The 'externalref' we sent is the Order ID
    const orderId = data.externalref;
    
    const order = await Order.findById(orderId);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: data.transactionid,
        status: 'SUCCESS',
        email_address: data.payer,
      };
      await order.save();
      console.log(`✅ Order ${orderId} Paid! Ref: ${data.transactionid}`);
    }
    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Server Error');
  }
};