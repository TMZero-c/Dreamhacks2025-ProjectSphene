const Note = require('../models/noteModel');
const mongoose = require('mongoose');

/**
 * Get notes for the current user
 */
exports.getUserNotes = async (req, res) => {
    try {
        const userId = req.user.id;
        const notes = await Note.find({ userId });
        res.status(200).json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ message: 'Error fetching notes', error: error.message });
    }
};

/**
 * Get notes for a specific lecture
 */
exports.getLectureNotes = async (req, res) => {
    try {
        const userId = req.user.id;
        const { lectureId } = req.params;

        // Validate lectureId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(lectureId)) {
            return res.status(400).json({ message: `Invalid lecture ID: ${lectureId}` });
        }

        const notes = await Note.find({ userId, lectureId });
        res.status(200).json(notes);
    } catch (error) {
        console.error('Error fetching lecture notes:', error);
        res.status(500).json({ message: 'Error fetching notes', error: error.message });
    }
};

/**
 * Get a specific note by ID
 */
exports.getNote = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate id is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: `Invalid note ID: ${id}` });
        }

        const note = await Note.findById(id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Check if note belongs to user
        if (note.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to access this note' });
        }

        res.status(200).json(note);
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ message: 'Error fetching note', error: error.message });
    }
};

/**
 * Create or update a note
 */
exports.createNote = async (req, res) => {
    try {
        const { id, title, content, lectureId } = req.body;
        const userId = req.user.id; // Use authenticated user's ID

        // Validate lectureId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(lectureId)) {
            return res.status(400).json({ message: `Invalid lecture ID: ${lectureId}` });
        }

        // Check if note exists (for update)
        let note;

        if (id && mongoose.Types.ObjectId.isValid(id)) {
            note = await Note.findById(id);

            // Verify ownership
            if (note && note.userId.toString() !== userId.toString()) {
                return res.status(403).json({ message: 'Not authorized to modify this note' });
            }
        }

        // If note doesn't exist, check if user already has a note for this lecture
        if (!note) {
            note = await Note.findOne({ userId, lectureId });
        }

        // Create or update the note
        if (note) {
            // Update existing note
            note.title = title || note.title;
            note.content = content;
            await note.save();
        } else {
            // Create new note
            note = new Note({
                title: title || 'Untitled Note',
                content,
                userId,
                lectureId
            });
            await note.save();
        }

        res.status(200).json(note);
    } catch (error) {
        console.error('Error creating/updating note:', error);
        res.status(500).json({ message: 'Error saving note', error: error.message });
    }
};

/**
 * Delete a note
 */
exports.deleteNote = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate id is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: `Invalid note ID: ${id}` });
        }

        const note = await Note.findById(id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Check if note belongs to user
        if (note.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this note' });
        }

        await note.remove();
        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ message: 'Error deleting note', error: error.message });
    }
};
