const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Cargar variables de entorno según el ambiente
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

const path = require('path');
const app = express();

app.use(cors({
  origin: [
    'https://v0.dev', 
    'https://*.vercel.app', 
    'http://localhost:3000',
    'http://18.221.14.186:3000',
    'http://18.221.14.186:3001'
  ],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Connect to MongoDB
connectDB();

// Serve uploaded files
app.use('/files', express.static(path.join(__dirname, '../files')));

// Basic health route
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// API routes
app.use('/api', require('./routes'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
