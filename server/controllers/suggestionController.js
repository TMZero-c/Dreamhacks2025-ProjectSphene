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

// Get suggestions for a note identified by lectureId and userId
exports.getSuggestionsByLectureAndUser = async (req, res) => {
    try {
        const { lectureId, userId } = req.params;

        // First find the note using lectureId and userId
        const note = await Note.findOne({ lectureId, userId });
        if (!note) {
            return res.status(404).json({ message: 'Note not found for this user and lecture' });
        }

        // Then get suggestions for this note
        const suggestions = await Suggestion.find({
            noteId: note._id.toString(),
            status: { $ne: 'dismissed' }
        }).sort({ createdAt: -1 });

        res.status(200).json(suggestions);
    } catch (error) {
        console.error('Error fetching suggestions by lecture and user:', error);
        res.status(500).json({ message: 'Failed to fetch suggestions', error: error.message });
    }
};

// Update suggestion status (accept or dismiss)
exports.respondToSuggestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;

        console.log(`Responding to suggestion ${id} with action: ${action}`);

        if (!id) {
            return res.status(400).json({ message: 'Suggestion ID is required' });
        }

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
            console.log(`Suggestion not found with ID: ${id}`);
            return res.status(404).json({ message: 'Suggestion not found' });
        }

        console.log(`Successfully updated suggestion ${id} to status: ${status}`);
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
        const { noteId, lectureId, userId } = req.body;

        // Get the target note - either directly by noteId or by lectureId+userId
        let targetNote;
        try {
            if (noteId) {
                // Try to find by MongoDB ObjectId if valid
                if (mongoose.Types.ObjectId.isValid(noteId)) {
                    targetNote = await Note.findById(noteId);
                    console.log('Searched by MongoDB ObjectId:', targetNote ? 'found' : 'not found');
                }

                // If not found, try as a string ID
                if (!targetNote) {
                    targetNote = await Note.findOne({ id: noteId });
                    console.log('Searched by string ID:', targetNote ? 'found' : 'not found');
                }
            } else if (lectureId && userId) {
                // Find by lectureId and userId combination
                targetNote = await Note.findOne({
                    lectureId: mongoose.Types.ObjectId.isValid(lectureId) ? lectureId : null,
                    userId
                });
                console.log(`Searched by lectureId and userId:`, targetNote ? 'found' : 'not found');
            }
        } catch (error) {
            console.error('Error finding note:', error);
            return res.status(500).json({ message: 'Error finding note', error: error.message });
        }

        if (!targetNote) {
            console.error('Note not found');
            return res.status(404).json({ message: 'Note not found' });
        }

        console.log(`Found target note: ${targetNote.title} with ID: ${targetNote._id}`);
        console.log(`Note's lecture ID: ${targetNote.lectureId}`);

        // Use provided lectureId or the one from the note
        const searchLectureId = lectureId || targetNote.lectureId;

        if (!searchLectureId) {
            console.error('No lecture ID available');
            return res.status(400).json({ message: 'No lecture ID available' });
        }

        console.log(`Using lecture ID for search: ${searchLectureId}`);

        // Get other notes from the same lecture, excluding the current user
        let otherNotes = [];
        try {
            const query = {
                lectureId: searchLectureId,
                userId: { $ne: targetNote.userId }
            };

            console.log('Finding other notes with query:', JSON.stringify(query));
            otherNotes = await Note.find(query);
            console.log(`Found ${otherNotes.length} other notes for comparison from users:`,
                otherNotes.map(note => note.userId));

            if (otherNotes.length === 0) {
                console.log('No other notes found for comparison');
                return res.status(200).json({
                    message: 'No other notes found for comparison',
                    suggestions: []
                });
            }
        } catch (error) {
            console.error('Error finding other notes:', error);
            return res.status(500).json({ message: 'Error finding comparison notes', error: error.message });
        }

        // Generate suggestions using OpenAI
        let suggestions = [];
        try {
            console.log('Generating suggestions with OpenAI...');
            suggestions = await openaiService.generateSuggestions(targetNote, otherNotes);
            console.log(`Generated ${suggestions.length} suggestions`);
        } catch (error) {
            console.error('Error generating suggestions with OpenAI:', error);
            return res.status(500).json({
                message: 'Error generating suggestions with AI',
                error: error.message
            });
        }

        if (suggestions.length === 0) {
            console.log('No suggestions were generated by OpenAI');
            return res.status(200).json({
                message: 'No suggestions generated',
                suggestions: []
            });
        }

        // Save suggestions to database
        let savedSuggestions = [];
        try {
            // Ensure each suggestion has the right noteId format
            suggestions = suggestions.map(suggestion => ({
                ...suggestion,
                noteId: targetNote._id.toString() // Use consistent ID format
            }));

            savedSuggestions = await Suggestion.insertMany(suggestions);
            console.log(`Saved ${savedSuggestions.length} suggestions to database`);
        } catch (error) {
            console.error('Error saving suggestions to database:', error);
            return res.status(500).json({
                message: 'Error saving suggestions',
                error: error.message
            });
        }

        res.status(200).json({
            message: 'Comparison complete',
            suggestions: savedSuggestions
        });

    } catch (error) {
        console.error('Error comparing documents:', error);
        res.status(500).json({ message: 'Failed to compare documents', error: error.message });
    }
};

// Delete all suggestions for a specific note
exports.deleteAllSuggestions = async (req, res) => {
    try {
        const { noteId } = req.params;

        console.log(`Deleting all suggestions for note: ${noteId}`);

        const result = await Suggestion.deleteMany({ noteId: noteId });

        console.log(`Deleted ${result.deletedCount} suggestions`);

        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} suggestions`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error deleting suggestions:', error);
        res.status(500).json({ message: 'Failed to delete suggestions', error: error.message });
    }
};

// Delete all suggestions for a note identified by lectureId and userId
exports.deleteAllSuggestionsByLectureAndUser = async (req, res) => {
    try {
        const { lectureId, userId } = req.params;

        console.log(`Finding note for lecture: ${lectureId} and user: ${userId}`);

        // First find the note using lectureId and userId
        const note = await Note.findOne({ lectureId, userId });
        if (!note) {
            return res.status(404).json({ message: 'Note not found for this user and lecture' });
        }

        console.log(`Found note: ${note._id}, deleting all suggestions`);

        // Then delete all suggestions for this note
        const result = await Suggestion.deleteMany({ noteId: note._id.toString() });

        console.log(`Deleted ${result.deletedCount} suggestions`);

        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} suggestions`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error deleting suggestions by lecture and user:', error);
        res.status(500).json({ message: 'Failed to delete suggestions', error: error.message });
    }
};
