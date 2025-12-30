const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { 
  getActiveBatch, 
  createBatch, 
  updateBatchStatus, 
  getBatches 
} = require('../controllers/batchController.js');

// Public route for checkout to find active batch
router.get('/active', getActiveBatch);

// Admin routes
router.route('/')
  .post(protect, admin, createBatch)
  .get(protect, admin, getBatches);

router.route('/:id/status')
  .put(protect, admin, updateBatchStatus);

module.exports = router;