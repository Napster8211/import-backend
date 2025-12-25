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

// 🛡️ CORS SECURITY CONFIGURATION
// This tells the server: "Only accept requests from these specific websites"
const allowedOrigins = [
  'http://localhost:3000',                  // Your Local Frontend
  'https://napster-imports.vercel.app',     // Your Future Vercel Frontend
  'https://napster-imports-web.vercel.app'  // Just in case Vercel names it slightly differently
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // Allow cookies/headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Body Parser Middleware (allows reading JSON data)
app.use(express.json());

// 🛣️ ROUTES
// (Make sure these paths match your actual files)
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// 🟢 Moolre Payment Route (If you still keep it in backend for legacy reasons)
// app.use('/api/payment', require('./routes/paymentRoutes')); 

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