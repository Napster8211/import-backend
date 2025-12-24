const path = require('path'); // <--- Required for file paths
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Import Routes
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const uploadRoutes = require('./routes/uploadRoutes'); // <--- Import Upload Routes

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/products', productRoutes); // <--- Connects Product Manager
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);    // <--- Connects File Uploader
app.use('/api/messages', require('./routes/messageRoutes'));

// PayPal Config (Placeholder for future payment integration)
app.get('/api/config/paypal', (req, res) =>
  res.send(process.env.PAYPAL_CLIENT_ID)
);

// ⬇️ MAKE UPLOADS FOLDER PUBLIC
// This tells the browser: "If the URL starts with /uploads, look in the uploads folder"
const dirname = path.resolve();
app.use('/uploads', express.static(path.join(dirname, '/uploads')));

// Root Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);