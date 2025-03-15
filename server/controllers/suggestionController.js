const Suggestion = require('../models/suggestionModel');
const Note = require('../models/noteModel');
const openaiService = require('../services/openaiService');
const mongoose = require('mongoose');

// Get suggestions for a specific note
exports.getSuggestions = async (req, res) => {
    try {
        const { noteId } = req.params;

        const suggestions = await Suggestion.find({
            noteId: noteId,
            status: { $ne: 'dismissed' } // Filter out dismissed suggestions
        })
            .sort({ createdAt: -1 })
            .exec();

        res.status(200).json(suggestions);
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        res.status(500).json({ message: 'Failed to fetch suggestions', error: error.message });
    }
};

// Update suggestion status (accept or dismiss)
exports.respondToSuggestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;

        if (!['accept', 'dismiss'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action. Must be either "accept" or "dismiss"' });
        }

        const status = action === 'accept' ? 'accepted' : 'dismissed';

        const suggestion = await Suggestion.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!suggestion) {
            return res.status(404).json({ message: 'Suggestion not found' });
        }

        res.status(200).json(suggestion);
    } catch (error) {
        console.error('Error updating suggestion status:', error);
        res.status(500).json({ message: 'Failed to update suggestion', error: error.message });
    }
};

// Trigger a comparison between documents and generate suggestions
exports.compareDocuments = async (req, res) => {
    console.log('[suggestionController] compareDocuments called with body:', req.body);
    try {
        const { noteId } = req.body;

        // Get the target note
        let targetNote;
        try {
            // Try to find by MongoDB ObjectId
            if (mongoose.Types.ObjectId.isValid(noteId)) {
                targetNote = await Note.findById(noteId);
            }

            // If not found or not a valid ObjectId, try as a string ID
            if (!targetNote) {
                targetNote = await Note.findOne({ id: noteId });
            }
        } catch (error) {
            console.error('Error finding note:', error);
        }

        if (!targetNote) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Get other notes on the same topic
        const otherNotes = await Note.find({
            topic: targetNote.topic,
            _id: { $ne: targetNote._id }, // Use _id for MongoDB ObjectId
            userId: { $ne: targetNote.userId }
        });

        if (otherNotes.length === 0) {
            return res.status(200).json({
                message: 'No other notes found for comparison',
                suggestions: []
            });
        }

        // Generate suggestions using OpenAI
        const suggestions = await openaiService.generateSuggestions(targetNote, otherNotes);

        // Save suggestions to database
        const savedSuggestions = await Suggestion.insertMany(suggestions);

        res.status(200).json({
            message: 'Comparison complete',
            suggestions: savedSuggestions
        });

    } catch (error) {
        console.error('Error comparing documents:', error);
        res.status(500).json({ message: 'Failed to compare documents', error: error.message });
    }
};
