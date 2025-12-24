const mongoose = require('mongoose');
const dotenv = require('dotenv');
const users = require('./data/users');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const importData = async () => {
  try {
    // ⚠️ WARNING: This wipes existing Users to ensure a clean slate
    await User.deleteMany();

    // Insert the new Admin and Customer
    await User.insertMany(users);

    console.log('✅ Admin User Created Successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

importData();