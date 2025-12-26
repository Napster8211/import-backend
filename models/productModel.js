const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
}, { timestamps: true });

const productSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  name: { type: String, required: true },
  
  // 📸 IMAGES
  image: { type: String, required: true }, // Main Thumbnail
  images: { type: [String], default: [] }, // Gallery Images (Slider)

  video: { type: String }, 
  brand: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  
  reviews: [reviewSchema],
  rating: { type: Number, required: true, default: 0 },
  numReviews: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true, default: 0 },
  countInStock: { type: Number, required: true, default: 0 },
  
  // 🎨 VARIANTS
  colors: { type: [String], required: true, default: [] }, // e.g. ["Red", "Blue"]

  // 🚚 LOGISTICS (Critical for profit)
  weight: { type: Number, required: true, default: 0.5 }, // Weight in KG
  shippingCategory: { 
    type: String, 
    required: true, 
    default: 'sea',
    enum: ['air', 'sea'] // Forces specific choices
  },

}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;