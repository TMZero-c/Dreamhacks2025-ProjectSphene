const express = require('express');
const router = express.Router();
const suggestionController = require('../controllers/suggestionController');

// Get suggestions for a note
router.get('/note/:noteId', suggestionController.getSuggestions);

// Respond to a suggestion (accept or dismiss)
router.post('/:id/respond', suggestionController.respondToSuggestion);

// Trigger document comparison
router.post('/compare', suggestionController.compareDocuments);

module.exports = router;
