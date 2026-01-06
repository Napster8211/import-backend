const asyncHandler = require('express-async-handler');
const Order = require('../models/Order'); // ⚠️ Ensure this file is named 'Order.js' in models/
const User = require('../models/User');   // ⚠️ Ensure this file is named 'User.js' in models/
const ShippingConfig = require('../models/ShippingConfig');

// 🟢 FIX: We import from 'productModel' because that is your actual filename
const Product = require('../models/productModel'); 

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
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  } else {
    
    // 🚚 SHIPPING CALCULATION ENGINE
    let finalShippingFee = 0;
    
    try {
      const config = await ShippingConfig.findOne();
      
      if (!config) {
        console.warn("⚠️ No Shipping Config found. Using fallback fee.");
        finalShippingFee = 50; 
      } else {
        const rates = config.getDerivedRates();
        
        let totalSeaWeight = 0;
        let totalAirWeight = 0;

        // Separate Items by Category
        orderItems.forEach(item => {
            const weight = item.weight || 0.5; 
            const method = item.shippingCategory || 'sea'; 

            if (method === 'air') {
                totalAirWeight += (weight * item.qty);
            } else {
                totalSeaWeight += (weight * item.qty);
            }
        });

        // Calculate Sea Shipping
        totalSeaWeight = Math.ceil(totalSeaWeight * 10) / 10;
        let seaFee = 0;
        if (totalSeaWeight > 0) {
            seaFee = totalSeaWeight * rates.derived.finalSeaRatePerKg;
            seaFee = Math.max(seaFee, config.minSeaShippingFee);
        }

        // Calculate Air Shipping
        let airFee = 0;
        if (totalAirWeight > 0) {
            totalAirWeight = Math.max(totalAirWeight, config.minAirChargeableWeight);
            totalAirWeight = Math.ceil(totalAirWeight * 10) / 10; 
            airFee = totalAirWeight * config.airRatePerKg;
        }

        finalShippingFee = seaFee + airFee;
        finalShippingFee = Math.round(finalShippingFee * 100) / 100;
      }
    } catch (err) {
      console.error("Shipping Calc Error:", err);
      finalShippingFee = 50; 
    }

    // Recalculate Total Price
    const safeTotalPrice = Number(itemsPrice) + Number(taxPrice) + Number(finalShippingFee);

    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice: finalShippingFee, 
      totalPrice: safeTotalPrice,
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
    order.deliveryStatus = 'Delivered'; 

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
    
    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

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

// @desc    Get dashboard statistics (Sales, Users, Orders)
// @route   GET /api/orders/summary
// @access  Private (Finance/Admin)
const getDashboardStats = asyncHandler(async (req, res) => {
    // 1. Get total counts
    const productsCount = await Product.countDocuments();
    const usersCount = await User.countDocuments();
    const ordersCount = await Order.countDocuments();
  
    // 2. Calculate Total Sales (Sum of all PAID orders)
    const salesResult = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } },
    ]);
  
    const totalSales = salesResult.length > 0 ? salesResult[0].totalSales : 0;
  
    // 3. Get daily sales for a chart
    const dailySales = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  
    res.json({
      usersCount,
      productsCount,
      ordersCount,
      totalSales,
      dailySales,
    });
});

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  getDashboardStats, 
};