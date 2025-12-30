const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const ShippingConfig = require('../models/ShippingConfig'); // 🟢 Imported the Shipping "Brain"

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    // shippingPrice, // 🔴 We ignore the frontend price now
    // totalPrice,    // 🔴 We recalculate this to be safe
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  } else {
    
    // 🚚 SHIPPING CALCULATION ENGINE (Tickets 2 & 3)
    let finalShippingFee = 0;
    
    try {
      // 1. Fetch Shipping Rules
      const config = await ShippingConfig.findOne();
      
      if (!config) {
        console.warn("⚠️ No Shipping Config found. Using fallback fee.");
        finalShippingFee = 50; // Safety fallback
      } else {
        const rates = config.getDerivedRates();
        
        let totalSeaWeight = 0;
        let totalAirWeight = 0;

        // 2. Separate Items by Category (Sea vs Air)
        orderItems.forEach(item => {
            // Default to 0.5kg if missing
            const weight = item.weight || 0.5; 
            // Default to 'sea' if missing
            const method = item.shippingCategory || 'sea'; 

            if (method === 'air') {
                totalAirWeight += (weight * item.qty);
            } else {
                totalSeaWeight += (weight * item.qty);
            }
        });

        // 3. Calculate Sea Shipping (Ticket 2)
        // Rule: Round UP to nearest 0.1kg
        totalSeaWeight = Math.ceil(totalSeaWeight * 10) / 10;
        
        let seaFee = 0;
        if (totalSeaWeight > 0) {
            seaFee = totalSeaWeight * rates.derived.finalSeaRatePerKg;
            // Enforce Minimum Sea Fee
            seaFee = Math.max(seaFee, config.minSeaShippingFee);
        }

        // 4. Calculate Air Shipping (Ticket 3)
        // Rule: Enforce minimum chargeable weight
        let airFee = 0;
        if (totalAirWeight > 0) {
            // Ensure min weight per shipment (e.g. 0.1kg)
            totalAirWeight = Math.max(totalAirWeight, config.minAirChargeableWeight);
            totalAirWeight = Math.ceil(totalAirWeight * 10) / 10; // Rounding
            
            airFee = totalAirWeight * config.airRatePerKg;
        }

        finalShippingFee = seaFee + airFee;
        
        // Round final fee to 2 decimal places
        finalShippingFee = Math.round(finalShippingFee * 100) / 100;
        
        console.log(`🚢 Shipping Calc: Sea(${totalSeaWeight}kg) + Air(${totalAirWeight}kg) = GH₵${finalShippingFee}`);
      }
    } catch (err) {
      console.error("Shipping Calc Error:", err);
      finalShippingFee = 50; // Fallback on error
    }

    // 5. Recalculate Total Price (Safety Check)
    const safeTotalPrice = Number(itemsPrice) + Number(taxPrice) + Number(finalShippingFee);

    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice: finalShippingFee, // 🟢 The calculated fee
      totalPrice: safeTotalPrice,      // 🟢 The safe total
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address,
    };

    // 🟢 FIX: Disable validation for old orders with missing address fields
    const updatedOrder = await order.save({ validateBeforeSave: false });
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.deliveryStatus = 'Delivered'; // Sync status

    // 🟢 FIX: Disable validation here too
    const updatedOrder = await order.save({ validateBeforeSave: false });
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (order) {
    order.deliveryStatus = status;
    
    // Auto-update flags based on status
    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    // 🟢 FIX: Disable validation here as well
    const updatedOrder = await order.save({ validateBeforeSave: false });
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name');
  res.json(orders);
});

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  updateOrderStatus,
};