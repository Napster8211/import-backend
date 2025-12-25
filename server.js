const express = require('express');
const dotenv = require('dotenv');
const path = require('path'); 
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Enable CORS (Allows your Vercel frontend to talk to this Render backend)
app.use(cors({
  origin: true, 
  credentials: true
}));

// Allow JSON data to be accepted
app.use(express.json());

// 🛣️ ROUTES
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// 🟢 NEW: Messages Route (Fixes the "Failed to load messages" error)
app.use('/api/messages', require('./routes/messageRoutes'));

// 📂 MAKE UPLOADS FOLDER PUBLIC
// This allows the frontend to access images at: https://your-backend.com/uploads/image.jpg
const dirname = path.resolve();
app.use('/uploads', express.static(path.join(dirname, '/uploads')));

// Root Route (Health Check)
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));