const express = require('express');
const router = express.Router();
const {
  createMessage,
  getMessages,
  markMessageAsRead,
  deleteMessage,
} = require('../controllers/messageController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .post(createMessage) // Public: Anyone can send a message
  .get(protect, admin, getMessages); // Private: Only Admin can read them

router.route('/:id/read').put(protect, admin, markMessageAsRead);
router.route('/:id').delete(protect, admin, deleteMessage);

module.exports = router;