const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// 1. Define Permissions (Matches Frontend)
const PERMISSIONS = {
  VIEW_ORDERS: 'view_orders',
  UPDATE_ORDER_STATUS: 'update_order_status',
  VIEW_PAYMENTS: 'view_payments',
  CONFIRM_PAYMENTS: 'confirm_payments',
  MANAGE_SHIPMENTS: 'manage_shipments', // ⬅️ The one crashing your app
  MANAGE_USERS: 'manage_users',
  VIEW_REPORTS: 'view_reports',
  SYSTEM_SETTINGS: 'system_settings',
};

// 2. Define Who Can Do What
const ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS), // Can do everything
  operations: [
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.UPDATE_ORDER_STATUS,
    PERMISSIONS.MANAGE_SHIPMENTS,
  ],
  finance: [
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.CONFIRM_PAYMENTS,
    PERMISSIONS.VIEW_REPORTS,
  ],
  support: [
    PERMISSIONS.VIEW_ORDERS,
  ],
  viewer: [
    PERMISSIONS.VIEW_REPORTS, // Can only read reports
  ],
  user: [], // Customers have NO admin permissions
};

// --- MIDDLEWARE FUNCTIONS ---

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Old simple Admin check (Kept for compatibility)
const admin = (req, res, next) => {
  const staffRoles = ['super_admin', 'operations', 'finance', 'support', 'viewer'];
  if (req.user && staffRoles.includes(req.user.role)) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as staff');
  }
};

// 🟢 NEW: Fine-Grained Permission Check
const authorize = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      res.status(401);
      throw new Error('Not authorized');
    }

    // Get permissions for this user's role
    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];

    // Check if they have the specific permission OR are super_admin
    if (req.user.role === 'super_admin' || userPermissions.includes(requiredPermission)) {
      next();
    } else {
      res.status(403); // Forbidden
      throw new Error(`Role '${req.user.role}' is not allowed to access this resource`);
    }
  };
};

module.exports = { protect, admin, authorize };