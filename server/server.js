const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database connection
require('./config/mongoConfig');

// Import routes
const noteRoutes = require('./routes/noteRoutes');
const suggestionRoutes = require('./routes/suggestionRoutes');
const lectureRoutes = require('./routes/lectureRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/notes', noteRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/lectures', lectureRoutes);

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client/build/index.html'));
    });
}

// Set port and start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
});
