const mongoose = require('mongoose');

const shippingLogSchema = mongoose.Schema({
  adminUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  action: { type: String, required: true }, // e.g., "UPDATE_RATES"
  
  // We store a snapshot of the changes
  changes: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const ShippingLog = mongoose.model('ShippingLog', shippingLogSchema);
module.exports = ShippingLog;