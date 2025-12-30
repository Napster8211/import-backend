const mongoose = require('mongoose');

const batchSchema = mongoose.Schema({
  name: { type: String, required: true }, // e.g. "JAN-SEA-2025"
  type: { 
    type: String, 
    required: true, 
    enum: ['sea', 'air'] 
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'open', 'closed', 'shipped', 'arrived', 'completed'],
    default: 'draft'
  },
  
  // Dates
  openDate: { type: Date },
  closeDate: { type: Date }, // Automated closing date
  expectedArrival: { type: Date },
  
  // Shipping Rates Locked for this Batch (Snapshot)
  // This ensures that even if you change global rates later, 
  // this batch keeps the old rates (Ticket 5 Requirement).
  lockedRates: {
    ratePerKg: Number,
    minFee: Number,
    exchangeRate: Number
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

const Batch = mongoose.model('Batch', batchSchema);
module.exports = Batch;