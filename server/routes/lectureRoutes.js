const express = require('express');
const router = express.Router();
const lectureController = require('../controllers/lectureController');

// Logging middleware
router.use((req, res, next) => {
    console.log(`[lectureRoutes] ${req.method} ${req.originalUrl}`);
    next();
});

// Get all lectures for a user (either created or joined)
router.get('/user/:userId', lectureController.getUserLectures);

// Get a specific lecture
router.get('/:id', lectureController.getLecture);

// Create a new lecture
router.post('/', lectureController.createLecture);

// Join a lecture using a code
router.post('/join', lectureController.joinLecture);

// Update a lecture
router.put('/:id', lectureController.updateLecture);

// Delete a lecture
router.delete('/:id', lectureController.deleteLecture);

module.exports = router;
