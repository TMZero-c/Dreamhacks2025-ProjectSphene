const express = require('express');
const router = express.Router();
const suggestionController = require('../controllers/suggestionController');

router.use((req, res, next) => {
    console.log(`[suggestionRoutes] ${req.method} ${req.originalUrl}`);
    next();
});

// Get suggestions by note ID
router.get('/note/:noteId', suggestionController.getSuggestions);

// Get suggestions by lecture ID and user ID
router.get('/lecture/:lectureId/user/:userId', suggestionController.getSuggestionsByLectureAndUser);

// Respond to a suggestion (accept or dismiss)
router.post('/:id/respond', (req, res, next) => {
    console.log(`Processing suggestion response for ID: ${req.params.id}, action: ${req.body.action}`);
    next();
}, suggestionController.respondToSuggestion);

// Trigger document comparison
router.post('/compare', suggestionController.compareDocuments);

// Delete all suggestions for a note
router.delete('/note/:noteId', suggestionController.deleteAllSuggestions);

// Delete all suggestions for a lecture/user combination
router.delete('/lecture/:lectureId/user/:userId', suggestionController.deleteAllSuggestionsByLectureAndUser);

module.exports = router;
