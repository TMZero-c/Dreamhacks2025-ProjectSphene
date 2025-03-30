const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(protect);

// GET /api/notes - Get all notes for current user
router.get('/', noteController.getUserNotes);

// GET /api/notes/lecture/:lectureId - Get notes for a specific lecture
router.get('/lecture/:lectureId', noteController.getLectureNotes);

// GET /api/notes/:id - Get a specific note
router.get('/:id', noteController.getNote);

// POST /api/notes - Create or update a note
router.post('/', noteController.createNote);

// DELETE /api/notes/:id - Delete a note
router.delete('/:id', noteController.deleteNote);

module.exports = router;
