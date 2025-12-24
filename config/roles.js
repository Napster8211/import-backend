// 1. Role Definitions [cite: 13]
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OPERATIONS: 'operations',
  FINANCE: 'finance',
  SUPPORT: 'support',
  VIEWER: 'viewer',
};

// 2. Permission Constants [cite: 22]
const PERMISSIONS = {
  VIEW_ORDERS: 'view_orders',
  UPDATE_ORDER_STATUS: 'update_order_status',
  VIEW_PAYMENTS: 'view_payments',
  CONFIRM_PAYMENTS: 'confirm_payments',
  MANAGE_SHIPMENTS: 'manage_shipments',
  MANAGE_USERS: 'manage_users',
  VIEW_REPORTS: 'view_reports',
  SYSTEM_SETTINGS: 'system_settings',
};

// 3. Role -> Permission Mapping [cite: 33]
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // All permissions
  [ROLES.OPERATIONS]: [
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.UPDATE_ORDER_STATUS,
    PERMISSIONS.MANAGE_SHIPMENTS,
  ],
  [ROLES.FINANCE]: [
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.CONFIRM_PAYMENTS,
    PERMISSIONS.VIEW_REPORTS,
  ],
  [ROLES.SUPPORT]: [
    PERMISSIONS.VIEW_ORDERS,
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_REPORTS,
  ],
};

module.exports = { ROLES, PERMISSIONS, ROLE_PERMISSIONS };