const Lecture = require('../models/lectureModel');
const mongoose = require('mongoose');

/**
 * Get a specific lecture by ID
 */
exports.getLecture = async (req, res) => {
    try {
        // Validate ID to prevent CastError
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: `Invalid lecture ID: ${req.params.id}` });
        }

        const lecture = await Lecture.findById(req.params.id);

        if (!lecture) {
            return res.status(404).json({ message: 'Lecture not found' });
        }

        res.status(200).json(lecture);
    } catch (error) {
        console.error('Error fetching lecture:', error);
        res.status(500).json({ message: 'Error fetching lecture', error: error.message });
    }
};

/**
 * Get all lectures for the current user (created or joined)
 */
exports.getUserLectures = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find lectures where user is creator or participant
        const lectures = await Lecture.find({
            $or: [
                { createdBy: userId },
                { participants: userId }
            ]
        });

        res.status(200).json(lectures);
    } catch (error) {
        console.error('Error fetching user lectures:', error);
        res.status(500).json({ message: 'Error fetching lectures', error: error.message });
    }
};

/**
 * Create a new lecture
 */
exports.createLecture = async (req, res) => {
    try {
        const { title, description } = req.body;

        // Generate a unique 6-character code
        const code = generateUniqueCode();

        const lecture = new Lecture({
            title,
            description,
            code,
            createdBy: req.user.id,
            participants: [req.user.id] // Creator is also a participant
        });

        const savedLecture = await lecture.save();
        res.status(201).json(savedLecture);
    } catch (error) {
        console.error('Error creating lecture:', error);
        res.status(500).json({ message: 'Error creating lecture', error: error.message });
    }
};

/**
 * Join a lecture using a code
 */
exports.joinLecture = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        // Find lecture by code
        const lecture = await Lecture.findOne({ code });

        if (!lecture) {
            return res.status(404).json({ message: 'Lecture not found with that code' });
        }

        // Check if user is already a participant
        if (lecture.participants.includes(userId)) {
            return res.status(200).json({ message: 'Already a participant', lecture });
        }

        // Add user to participants
        lecture.participants.push(userId);
        await lecture.save();

        res.status(200).json(lecture);
    } catch (error) {
        console.error('Error joining lecture:', error);
        res.status(500).json({ message: 'Error joining lecture', error: error.message });
    }
};

/**
 * Generate a random 6-character code for lectures
 */
function generateUniqueCode() {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
    let code = '';

    // Generate a 6-character code
    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters.charAt(randomIndex);
    }

    return code;
}

// Update lecture details
exports.updateLecture = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        const lecture = await Lecture.findByIdAndUpdate(
            id,
            { title, description },
            { new: true }
        );

        if (!lecture) {
            return res.status(404).json({ message: 'Lecture not found' });
        }

        res.status(200).json(lecture);
    } catch (error) {
        console.error('Error updating lecture:', error);
        res.status(500).json({ message: 'Failed to update lecture', error: error.message });
    }
};

// Delete a lecture
exports.deleteLecture = async (req, res) => {
    try {
        const { id } = req.params;
        const lecture = await Lecture.findByIdAndDelete(id);

        if (!lecture) {
            return res.status(404).json({ message: 'Lecture not found' });
        }

        // Note: We might also want to delete associated notes or suggest users to reassign them

        res.status(200).json({ message: 'Lecture deleted successfully' });
    } catch (error) {
        console.error('Error deleting lecture:', error);
        res.status(500).json({ message: 'Failed to delete lecture', error: error.message });
    }
};
