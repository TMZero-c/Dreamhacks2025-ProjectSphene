const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: mongoose.Schema.Types.Mixed, // Store Quill Delta object
        required: true
    },
    noteId: {
        type: String, // Changed from ObjectId to String to handle both string IDs and ObjectIDs
        required: true
    },
    type: {
        type: String,
        enum: ['missing_content', 'clarification', 'structure', 'key_point'],
        required: true
    },
    insertionPoint: {
        type: mongoose.Schema.Types.Mixed, // Store insertion point information
        default: null
    },
    source: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'dismissed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const Suggestion = mongoose.model('Suggestion', suggestionSchema);

module.exports = Suggestion;
