const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // 1. Require bcrypt

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    role: {
      type: String,
      required: true,
      default: 'user', // Default role is 'user'
      enum: ['user', 'admin', 'super_admin', 'operations', 'finance', 'support', 'viewer'],
    },
  },
  {
    timestamps: true,
  }
);

// 🟢 FIX 1: Add the matchPassword method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 🟢 FIX 2: Encrypt password automatically before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;