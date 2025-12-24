const Order = require('../models/Order');
const axios = require('axios'); // We need to install this: npm install axios

// @desc    Initiate Mobile Money Payment (Collection)
// @route   POST /api/payment/initiate
// @access  Private (User)
exports.initiatePayment = async (req, res) => {
  const { orderId, paymentType, phoneNumber, network } = req.body; 
  // paymentType must be 'ITEM_COST' or 'SHIPPING_FEE'

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    let amountToCharge = 0;
    
    // 1. Determine Amount based on Payment Type
    if (paymentType === 'ITEM_COST') {
      if (order.isItemPaid) return res.status(400).json({ message: 'Items already paid for' });
      amountToCharge = order.totalItemCost;
    } else if (paymentType === 'SHIPPING_FEE') {
      if (!order.isShippingPaid) return res.status(400).json({ message: 'Shipping already paid or not ready' });
      if (order.shippingCost <= 0) return res.status(400).json({ message: 'Shipping cost not calculated yet' });
      amountToCharge = order.shippingCost;
    } else {
      return res.status(400).json({ message: 'Invalid payment type' });
    }

    // 2. Call Moolre API to request payment
    // NOTE: Replace '/v2/payments/collect' with the exact endpoint from your Moolre Docs
    const moolreResponse = await axios.post('https://api.moolre.com/v1/payments', {
      amount: amountToCharge,
      currency: "GHS",
      customer_phone: phoneNumber,
      customer_network: network, // MTN, VOD, AIR
      reference: `${orderId}_${paymentType}`, // Custom Ref: 6734abc_ITEM_COST
      callback_url: `${process.env.BASE_URL}/api/payment/webhook`
    }, {
      headers: {
        'X-API-KEY': process.env.MOOLRE_SECRET_KEY,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Payment prompt sent to user device',
      data: moolreResponse.data
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Payment Initiation Failed', error: error.message });
  }
};

// @desc    Moolre Webhook (They call this when payment succeeds)
// @route   POST /api/payment/webhook
// @access  Public (Moolre Only)
exports.handleWebhook = async (req, res) => {
  const { reference, status, transaction_id } = req.body;

  // 1. Verify it's a success
  if (status !== 'SUCCESS') {
    return res.status(200).send('OK'); // Acknowledge even if failed so Moolre stops retrying
  }

  // 2. Parse our Custom Reference (Format: OrderID_PaymentType)
  const [orderId, paymentType] = reference.split('_');

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).send('Order not found');

    // 3. Update the Order based on what was paid
    if (paymentType === 'ITEM_COST') {
      order.isItemPaid = true;
      order.itemPaymentRef = transaction_id;
      order.itemPaymentDate = Date.now();
      order.status = 'PROCESSING_CHINA';
      order.timeline.push({ status: 'PROCESSING_CHINA', note: 'Payment received. Ordering from supplier.' });
    } 
    else if (paymentType === 'SHIPPING_FEE') {
      order.isShippingPaid = true;
      order.shippingPaymentRef = transaction_id;
      order.status = 'READY_FOR_PICKUP';
      order.timeline.push({ status: 'READY_FOR_PICKUP', note: 'Shipping paid. Ready for delivery.' });
    }

    await order.save();
    console.log(`✅ Payment Recorded: ${paymentType} for Order ${orderId}`);
    
    res.status(200).send('Webhook received');

  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Server Error');
  }
};