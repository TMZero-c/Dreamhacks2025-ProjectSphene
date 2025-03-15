const Note = require('../models/noteModel');
const mongoose = require('mongoose');

// Get the note for a specific user and lecture
exports.getNotes = async (req, res) => {
    try {
        const { userId, lectureId } = req.params;

        const query = { userId };
        if (lectureId) {
            query.lectureId = lectureId;
        }

        const notes = await Note.find(query)
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

// Create a new note or update if exists (upsert)
exports.createNote = async (req, res) => {
    try {
        const { id, title, content, userId, topic, lectureId } = req.body;

        if (!lectureId) {
            return res.status(400).json({ message: 'Lecture ID is required' });
        }

        // Check if note already exists for this user and lecture
        let existingNote = await Note.findOne({ userId, lectureId });

        if (existingNote) {
            // Update the existing note
            existingNote.title = title || existingNote.title;
            existingNote.content = content;
            if (topic) existingNote.topic = topic;

            const savedNote = await existingNote.save();
            return res.status(200).json(savedNote);
        }

        // Create a new note if none exists
        const newNote = new Note({
            id, // Store string ID if provided
            title,
            content,
            userId,
            lectureId,
            topic: topic || 'general'
        });

        const savedNote = await newNote.save();
        res.status(201).json(savedNote);
    } catch (error) {
        console.error('Error creating/updating note:', error);
        res.status(500).json({ message: 'Failed to save note', error: error.message });
    }
};

// Update an existing note - using upsert to ensure we have one note per lecture
exports.updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, topic, userId, lectureId } = req.body;

        if (!lectureId) {
            return res.status(400).json({ message: 'Lecture ID is required' });
        }

        // Try to find the note by ID first
        let note;
        if (mongoose.Types.ObjectId.isValid(id)) {
            note = await Note.findById(id);
        }

        if (!note && id) {
            // Try to find by string ID
            note = await Note.findOne({ id });
        }

        // If still not found, look for a note with this user and lecture
        if (!note) {
            note = await Note.findOne({ userId, lectureId });
        }

        if (note) {
            // Update existing note
            note.title = title || note.title;
            note.content = content || note.content;
            if (topic) note.topic = topic;

            const updatedNote = await note.save();
            return res.status(200).json(updatedNote);
        } else {
            // Create a new note if none exists
            const newNote = new Note({
                title,
                content,
                userId,
                lectureId,
                topic: topic || 'general'
            });

            const savedNote = await newNote.save();
            return res.status(201).json(savedNote);
        }
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
