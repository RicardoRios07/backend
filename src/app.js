const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno según el entorno
const isProduction = process.env.NODE_ENV === 'production';
const possibleEnvFiles = isProduction
  ? [
    path.join(__dirname, '../.env.production'),
    path.join(__dirname, '../.env')
  ]
  : [
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../.env')
  ];

let envLoaded = false;
for (const envFile of possibleEnvFiles) {
  if (fs.existsSync(envFile)) {
    console.log(`📄 Cargando configuración desde: ${path.basename(envFile)}`);
    dotenv.config({ path: envFile });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️  No se encontró archivo .env, usando variables de entorno del sistema');
  dotenv.config(); // Intentar cargar .env por defecto
}

const app = express();

// CORS configuration
app.use(cors({
  origin: '*', // Permitir todas las conexiones como solicitó el usuario
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
