const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db'); // Ensure this path matches your file structure
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// 🛡️ CORS SECURITY CONFIGURATION (UPDATED)
// We use 'origin: true' which automatically allows the domain requesting access.
// This fixes the Vercel blocking issue while keeping credentials working.
app.use(cors({
  origin: true, // 🟢 This allows requests from Vercel, Localhost, or Mobile dynamically
  credentials: true, // Allows cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Body Parser Middleware (allows reading JSON data)
app.use(express.json());

// 🛣️ ROUTES
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// Test Route (To check if server is alive)
app.get('/', (req, res) => {
  res.send('API is running...');
});

// ⚠️ Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// 🚀 START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));