const express = require('express');
const router = express.Router();
const suggestionController = require('../controllers/suggestionController');

router.use((req, res, next) => {
    console.log(`[suggestionRoutes] ${req.method} ${req.originalUrl}`);
    next();
});

// Get suggestions for a note
router.get('/note/:noteId', suggestionController.getSuggestions);

// Respond to a suggestion (accept or dismiss)
router.post('/:id/respond', (req, res, next) => {
    console.log(`Processing suggestion response for ID: ${req.params.id}, action: ${req.body.action}`);
    next();
}, suggestionController.respondToSuggestion);

// Trigger document comparison
router.post('/compare', suggestionController.compareDocuments);

module.exports = router;
