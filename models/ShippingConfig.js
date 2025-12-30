const mongoose = require('mongoose');

const shippingConfigSchema = mongoose.Schema({
  // 💱 Exchange Rates
  usdToGhsRate: { type: Number, required: true, default: 12.5 }, // Example rate

  // 🚢 Sea Shipping Constants
  seaCbmRateUsd: { type: Number, required: true, default: 130 }, // Cost per CBM in USD
  cbmToKgRatio: { type: Number, required: true, default: 167 },  // Locked physics constant
  seaBufferPercentage: { type: Number, required: true, default: 0.15 }, // 15% safety margin
  minSeaShippingFee: { type: Number, required: true, default: 20 }, // Minimum fee in GHS

  // ✈️ Air Shipping Constants
  airRatePerKg: { type: Number, required: true, default: 150 }, // GHS per KG
  minAirChargeableWeight: { type: Number, required: true, default: 0.1 }, // Min weight

  // 📅 System
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastUpdatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// 🧠 The "Brain" Logic: Calculate Derived Rates Automatically
// Ticket 1 Requirement: "System recalculates derived rates automatically"
shippingConfigSchema.methods.getDerivedRates = function() {
  const seaCostPerCbmGhs = this.seaCbmRateUsd * this.usdToGhsRate;
  const seaCostPerKgRaw = seaCostPerCbmGhs / this.cbmToKgRatio;
  const seaCostPerKgFinal = seaCostPerKgRaw * (1 + this.seaBufferPercentage);

  return {
    ...this.toObject(),
    derived: {
      seaCostPerCbmGhs: Math.round(seaCostPerCbmGhs * 100) / 100,
      seaCostPerKgRaw: Math.round(seaCostPerKgRaw * 100) / 100,
      finalSeaRatePerKg: Math.round(seaCostPerKgFinal * 100) / 100
    }
  };
};

const ShippingConfig = mongoose.model('ShippingConfig', shippingConfigSchema);
module.exports = ShippingConfig;