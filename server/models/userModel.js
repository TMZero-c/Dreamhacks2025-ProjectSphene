const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    // Add more fields as needed (e.g., password, profile, etc.)
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;
