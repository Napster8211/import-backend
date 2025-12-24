const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false }, // To track if you opened it
  },
  {
    timestamps: true, // Auto-adds createdAt time
  }
);

module.exports = mongoose.model('Message', messageSchema);