const ShippingConfig = require('../models/ShippingConfig');

// @desc    Get Current Shipping Configuration
// @route   GET /api/shipping/config
// @access  Private/Admin
exports.getShippingConfig = async (req, res) => {
  try {
    // Try to find the existing config
    let config = await ShippingConfig.findOne();

    // If no config exists (first run), create a default one
    if (!config) {
      config = await ShippingConfig.create({});
      console.log("⚙️ Initialized Default Shipping Configuration");
    }

    // Return config with the calculated derived rates
    res.json(config.getDerivedRates());
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update Shipping Configuration
// @route   PUT /api/shipping/config
// @access  Private/Admin
exports.updateShippingConfig = async (req, res) => {
  try {
    const config = await ShippingConfig.findOne();

    if (config) {
      // Update fields if they are sent in the request
      config.usdToGhsRate = req.body.usdToGhsRate || config.usdToGhsRate;
      config.seaCbmRateUsd = req.body.seaCbmRateUsd || config.seaCbmRateUsd;
      config.seaBufferPercentage = req.body.seaBufferPercentage || config.seaBufferPercentage;
      config.minSeaShippingFee = req.body.minSeaShippingFee || config.minSeaShippingFee;
      config.airRatePerKg = req.body.airRatePerKg || config.airRatePerKg;
      config.minAirChargeableWeight = req.body.minAirChargeableWeight || config.minAirChargeableWeight;
      
      // Track who changed it
      config.lastUpdatedBy = req.user._id;
      config.lastUpdatedAt = Date.now();

      const updatedConfig = await config.save();
      res.json(updatedConfig.getDerivedRates());
    } else {
      res.status(404).json({ message: 'Configuration not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Update Failed', error: error.message });
  }
};