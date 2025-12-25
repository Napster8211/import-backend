const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false }, // To track if you've opened it
}, {
  timestamps: true, // Adds createdAt time automatically
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;