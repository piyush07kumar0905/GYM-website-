require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');


connectDB();


const app = express();


app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, '..')));


app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/membership', require('./routes/membership'));
app.use('/api/admin', require('./routes/admin'));


app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    server: 'APS GYM API',
    time: new Date().toISOString(),
  });
});


app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 APS GYM Server running on http://localhost:${PORT}`);
  console.log(`📦 API:      http://localhost:${PORT}/api/health`);
  console.log(`🎨 Frontend: http://localhost:${PORT}/index.html`);
  console.log(`🔧 Admin:    http://localhost:${PORT}/admin.html\n`);
});
