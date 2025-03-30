const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    id: {
        type: String // Client-side ID
    },
    title: {
        type: String,
        required: true,
        trim: true,
        default: 'Untitled Note'
    },
    content: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    lectureId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lecture',
        required: true
    },
    topic: {
        type: String,
        default: 'general'
    }
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

// Create compound UNIQUE index for user+lecture to ensure one note per user per lecture
noteSchema.index({ userId: 1, lectureId: 1 }, { unique: true });

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
