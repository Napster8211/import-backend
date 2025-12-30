const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    // 🟢 Your Custom Roles
    role: {
      type: String,
      required: true,
      default: 'user',
      enum: ['user', 'super_admin', 'operations', 'finance', 'support', 'viewer'],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 🟢 FIX: Correct Pre-Save Hook
// We remove 'next' and use pure async/await to prevent errors
userSchema.pre('save', async function () {
  // If password is NOT modified, we simply return (stop here)
  if (!this.isModified('password')) {
    return;
  }

  // Otherwise, we hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;