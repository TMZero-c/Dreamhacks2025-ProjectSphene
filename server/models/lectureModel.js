const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    createdBy: {
        type: String,
        required: true,
        ref: 'User'
    },
    participants: [{
        type: String,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Create a compound index for title and code for faster lookups
lectureSchema.index({ title: 1, code: 1 });

const Lecture = mongoose.model('Lecture', lectureSchema);

module.exports = Lecture;
