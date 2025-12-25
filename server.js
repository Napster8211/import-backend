const express = require('express');
const dotenv = require('dotenv');
const path = require('path'); // 🟢 1. Import Path
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: true, 
  credentials: true
}));

app.use(express.json());

// 🛣️ ROUTES
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// 🟢 2. Add the Upload Route
app.use('/api/upload', require('./routes/uploadRoutes'));

// 🟢 3. Make the 'uploads' folder static (Publicly accessible)
const dirname = path.resolve();
app.use('/uploads', express.static(path.join(dirname, '/uploads')));

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));