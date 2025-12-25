const asyncHandler = require('express-async-handler');
const Message = require('../models/messageModel');

// @desc    Create new message (Contact Form)
// @route   POST /api/messages
// @access  Public
const createMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  const newMessage = await Message.create({
    name,
    email,
    subject,
    message,
  });

  if (newMessage) {
    res.status(201).json(newMessage);
  } else {
    res.status(400);
    throw new Error('Invalid message data');
  }
});

// @desc    Get all messages
// @route   GET /api/messages
// @access  Private/Admin
const getMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({}).sort({ createdAt: -1 }); // Newest first
  res.json(messages);
});

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private/Admin
const markMessageAsRead = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (message) {
    message.isRead = true;
    const updatedMessage = await message.save();
    res.json(updatedMessage);
  } else {
    res.status(404);
    throw new Error('Message not found');
  }
});

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private/Admin
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (message) {
    await message.deleteOne();
    res.json({ message: 'Message removed' });
  } else {
    res.status(404);
    throw new Error('Message not found');
  }
});

module.exports = {
  createMessage,
  getMessages,
  markMessageAsRead,
  deleteMessage,
};