const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 🕵️‍♂️ DEBUG: STEP 1 - Request Arrived
  console.log('\n====================================');
  console.log('📢 LOGIN REQUEST RECEIVED');
  console.log('📧 Email:', email);
  // We mask the password for safety in logs, but confirm we got one
  console.log('🔑 Password:', password ? '******** (Received)' : 'MISSING ❌');

  // 🕵️‍♂️ DEBUG: STEP 2 - Database Search
  const user = await User.findOne({ email });

  if (!user) {
    console.log('❌ DATABASE: User NOT found.');
    console.log('⚠️  CHECK: Is your Backend connected to the same DB as your Admin Account?');
    res.status(401);
    throw new Error('Invalid email or password (User not found)');
  } 
  
  console.log(`✅ DATABASE: Found User: [${user.name}]`);
  console.log(`👤 ROLE: [${user.role}]`);

  // 🕵️‍♂️ DEBUG: STEP 3 - Password Check
  const isMatch = await user.matchPassword(password);
  console.log('🤔 Checking Password...', isMatch ? 'MATCH ✅' : 'FAIL ❌');

  if (isMatch) {
    console.log('🎉 SUCCESS: Sending Token...');
    console.log('====================================\n');
    
    // Check if user is active (optional security)
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role, // Send role to frontend
      token: generateToken(user._id),
    });
  } else {
    console.log('❌ FAILURE: Incorrect Password.');
    console.log('====================================\n');
    res.status(401);
    throw new Error('Invalid email or password (Wrong Password)');
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Default role is 'user' unless specified
  const user = await User.create({
    name,
    email,
    password,
    role: 'user', 
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile (Self)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    
    // Only allow role updates here
    if (req.body.role) {
      user.role = req.body.role; 
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // Prevent deleting super_admin
    if (user.role === 'super_admin') {
      res.status(400);
      throw new Error('Cannot delete Super Admin');
    }
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser, 
};