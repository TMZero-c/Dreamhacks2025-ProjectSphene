const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');

// Logging middleware
router.use((req, res, next) => {
    console.log(`[noteRoutes] ${req.method} ${req.originalUrl}`);
    next();
});

// Get all notes for a user
router.get('/user/:userId', noteController.getNotes);

// Get a specific note
router.get('/:id', noteController.getNote);

// Create a new note
router.post('/', noteController.createNote);

// Update a note
router.put('/:id', noteController.updateNote);

// Delete a note
router.delete('/:id', noteController.deleteNote);

module.exports = router;
