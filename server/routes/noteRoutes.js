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

// Get all notes for a user in a specific lecture
router.get('/user/:userId/lecture/:lectureId', noteController.getNotes);

// Get a specific note
router.get('/:id', noteController.getNote);

// Create a new note
router.post('/', (req, res, next) => {
    // Log request body for debugging
    console.log('[noteRoutes] Creating note with data:', {
        title: req.body.title,
        userId: req.body.userId,
        lectureId: req.body.lectureId
    });
    next();
}, noteController.createNote);

// Update a note
router.put('/:id', (req, res, next) => {
    // Log request body for debugging
    console.log('[noteRoutes] Updating note:', req.params.id, 'with data:', {
        title: req.body.title,
        lectureId: req.body.lectureId
    });
    next();
}, noteController.updateNote);

// Delete a note
router.delete('/:id', noteController.deleteNote);

module.exports = router;
