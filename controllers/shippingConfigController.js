const ShippingConfig = require('../models/ShippingConfig');
const ShippingLog = require('../models/ShippingLog'); // 🟢 Import the Logger

// @desc    Get Current Shipping Configuration
// @route   GET /api/shipping/config
// @access  Private/Admin
exports.getShippingConfig = async (req, res) => {
  try {
    let config = await ShippingConfig.findOne();
    if (!config) {
      config = await ShippingConfig.create({});
    }
    res.json(config.getDerivedRates());
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update Shipping Configuration & Log Changes (Ticket 9)
// @route   PUT /api/shipping/config
// @access  Private/Admin
exports.updateShippingConfig = async (req, res) => {
  try {
    const config = await ShippingConfig.findOne();

    if (!config) {
      return res.status(404).json({ message: 'Configuration not found' });
    }

    // 🟢 1. Detect Changes
    const changes = [];
    const fieldsToCheck = [
      'usdToGhsRate', 
      'seaCbmRateUsd', 
      'seaBufferPercentage', 
      'minSeaShippingFee', 
      'airRatePerKg', 
      'minAirChargeableWeight'
    ];

    fieldsToCheck.forEach(field => {
      // If the value in body is different from DB, log it
      if (req.body[field] !== undefined && req.body[field] != config[field]) {
        changes.push({
          field: field,
          oldValue: config[field],
          newValue: req.body[field]
        });
        // Update the config object
        config[field] = req.body[field];
      }
    });

    // 🟢 2. Save Audit Log (If there were changes)
    if (changes.length > 0) {
      await ShippingLog.create({
        adminUser: req.user._id,
        action: 'UPDATE_RATES',
        changes: changes,
        ipAddress: req.ip
      });
      console.log(`📝 Audit Log Created: ${changes.length} changes by ${req.user.name}`);
    }

    // 3. Save the Config
    config.lastUpdatedBy = req.user._id;
    config.lastUpdatedAt = Date.now();
    const updatedConfig = await config.save();
    
    res.json(updatedConfig.getDerivedRates());

  } catch (error) {
    res.status(500).json({ message: 'Update Failed', error: error.message });
  }
};

// @desc    Get Change History (Ticket 9)
// @route   GET /api/shipping/logs
// @access  Private/Admin
exports.getShippingLogs = async (req, res) => {
  try {
    const logs = await ShippingLog.find({})
      .populate('adminUser', 'name email')
      .sort({ timestamp: -1 }) // Newest first
      .limit(50); // Keep it fast
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Fetch Logs Failed', error: error.message });
  }
};