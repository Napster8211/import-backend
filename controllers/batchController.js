const Batch = require('../models/Batch');
const ShippingConfig = require('../models/ShippingConfig');

// @desc    Get the currently OPEN batch for a specific type (Sea/Air)
// @route   GET /api/batches/active
// @access  Public (Used by Checkout)
const getActiveBatch = async (req, res) => {
  const { type } = req.query; // ?type=sea or ?type=air

  try {
    // Find a batch that is currently OPEN
    const batch = await Batch.findOne({ 
      status: 'open',
      type: type || 'sea' 
    });

    if (batch) {
      res.json(batch);
    } else {
      // ⚠️ Critical: If no batch is open, checkout should be blocked
      res.status(404).json({ message: 'No active shipping batch found.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new Batch (Admin)
// @route   POST /api/batches
// @access  Private/Admin
const createBatch = async (req, res) => {
  try {
    const { name, type, closeDate, expectedArrival } = req.body;

    const batch = new Batch({
      name,
      type,
      status: 'draft', // Starts as draft
      closeDate,
      expectedArrival,
      createdBy: req.user._id
    });

    const createdBatch = await batch.save();
    res.status(201).json(createdBatch);
  } catch (error) {
    res.status(400).json({ message: 'Invalid batch data' });
  }
};

// @desc    Update Batch Status (Open/Close)
// @route   PUT /api/batches/:id/status
// @access  Private/Admin
const updateBatchStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const batch = await Batch.findById(req.params.id);

    if (batch) {
      batch.status = status;
      
      // If opening, snapshot the current rates (Ticket 5 Logic)
      if (status === 'open') {
        batch.openDate = Date.now();
        
        // Fetch current global config to lock it in
        const config = await ShippingConfig.findOne();
        if (config) {
            batch.lockedRates = {
                ratePerKg: batch.type === 'sea' ? config.getDerivedRates().derived.finalSeaRatePerKg : config.airRatePerKg,
                minFee: batch.type === 'sea' ? config.minSeaShippingFee : config.minAirChargeableWeight,
                exchangeRate: config.usdToGhsRate
            };
        }
      }

      const updatedBatch = await batch.save();
      res.json(updatedBatch);
    } else {
      res.status(404).json({ message: 'Batch not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
};

// @desc    Get All Batches (Admin)
// @route   GET /api/batches
// @access  Private/Admin
const getBatches = async (req, res) => {
  const batches = await Batch.find({}).sort({ createdAt: -1 });
  res.json(batches);
};

module.exports = {
  getActiveBatch,
  createBatch,
  updateBatchStatus,
  getBatches
};