const Note = require('../models/noteModel');
const mongoose = require('mongoose');

// Get all notes for a specific user
exports.getNotes = async (req, res) => {
    try {
        const { userId } = req.params;

        const notes = await Note.find({ userId })
            .sort({ updatedAt: -1 }) // Sort by most recently updated
            .exec();

        res.status(200).json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ message: 'Failed to fetch notes', error: error.message });
    }
};

// Get a single note by ID
exports.getNote = async (req, res) => {
    try {
        const { id } = req.params;
        let note;

        // Try to find by MongoDB ObjectId if valid
        if (mongoose.Types.ObjectId.isValid(id)) {
            note = await Note.findById(id);
        }

        // If not found, try searching by string ID
        if (!note) {
            note = await Note.findOne({ id: id });
        }

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.status(200).json(note);
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ message: 'Failed to fetch note', error: error.message });
    }
};

// Create a new note
exports.createNote = async (req, res) => {
    try {
        const { id, title, content, userId, topic } = req.body;

        const newNote = new Note({
            id, // Store string ID if provided
            title,
            content,
            userId,
            topic: topic || 'general'
        });

        const savedNote = await newNote.save();
        res.status(201).json(savedNote);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Failed to create note', error: error.message });
    }
};

// Update an existing note
exports.updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, topic } = req.body;
        let updatedNote;

        // Try to update by MongoDB ObjectId if valid
        if (mongoose.Types.ObjectId.isValid(id)) {
            updatedNote = await Note.findByIdAndUpdate(
                id,
                {
                    title,
                    content,
                    ...(topic && { topic })
                },
                { new: true }
            );
        }

        // If not found, try updating by string ID
        if (!updatedNote) {
            updatedNote = await Note.findOneAndUpdate(
                { id: id },
                {
                    title,
                    content,
                    ...(topic && { topic })
                },
                { new: true }
            );
        }

        if (!updatedNote) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.status(200).json(updatedNote);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'Failed to update note', error: error.message });
    }
};

// Delete a note
exports.deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        let deletedNote;

        // Try to delete by MongoDB ObjectId if valid
        if (mongoose.Types.ObjectId.isValid(id)) {
            deletedNote = await Note.findByIdAndDelete(id);
        }

        // If not found, try deleting by string ID
        if (!deletedNote) {
            deletedNote = await Note.findOneAndDelete({ id: id });
        }

        if (!deletedNote) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ message: 'Failed to delete note', error: error.message });
    }
};
