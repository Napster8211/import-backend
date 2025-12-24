const express = require('express');
const router = express.Router();
const { 
  sendMessage, 
  getMessages, 
  markMessageRead 
} = require('../controllers/messageController');

// ⬇️ UPDATE IMPORTS: Use 'authorize' instead of 'admin'
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(sendMessage) // Public: Anyone can send a message
  .get(
    protect, 
    authorize('manage_users'), // ⬅️ UPDATED: Only Admins/Support can read
    getMessages
  );

router.route('/:id/read').put(
  protect, 
  authorize('manage_users'), // ⬅️ UPDATED
  markMessageRead
);

module.exports = router;