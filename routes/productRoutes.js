const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
} = require('../controllers/productController');

// ⬇️ IMPORT THE NEW MIDDLEWARE HERE
const { protect, authorize } = require('../middleware/authMiddleware');

// Public Routes
router.get('/top', getTopProducts);
router.route('/').get(getProducts);
router.route('/:id').get(getProductById);

// 🔒 PROTECTED ROUTES
// We use 'authorize' now instead of 'admin'

router.route('/').post(
  protect, 
  authorize('manage_shipments'), // Using a permission string
  createProduct
);

router.route('/:id')
  .put(protect, authorize('manage_shipments'), updateProduct)
  .delete(protect, authorize('manage_shipments'), deleteProduct);

router.route('/:id/reviews').post(protect, createProductReview);

module.exports = router;