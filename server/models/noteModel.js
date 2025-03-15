const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    id: {
        type: String // Add this field to support string IDs from frontend
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
        type: String,
        required: true,
        ref: 'User'
    },
    topic: {
        type: String,
        default: 'general'
    }
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
