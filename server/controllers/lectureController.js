const Lecture = require('../models/lectureModel');

// Get all lectures for a specific user (as creator or participant)
exports.getUserLectures = async (req, res) => {
    try {
        const { userId } = req.params;

        const lectures = await Lecture.find({
            $or: [
                { createdBy: userId },
                { participants: userId }
            ]
        }).sort({ updatedAt: -1 });

        res.status(200).json(lectures);
    } catch (error) {
        console.error('Error fetching lectures:', error);
        res.status(500).json({ message: 'Failed to fetch lectures', error: error.message });
    }
};

// Get a specific lecture by ID
exports.getLecture = async (req, res) => {
    try {
        const { id } = req.params;
        const lecture = await Lecture.findById(id);

        if (!lecture) {
            return res.status(404).json({ message: 'Lecture not found' });
        }

        res.status(200).json(lecture);
    } catch (error) {
        console.error('Error fetching lecture:', error);
        res.status(500).json({ message: 'Failed to fetch lecture', error: error.message });
    }
};

// Create a new lecture
exports.createLecture = async (req, res) => {
    try {
        const { title, description, code, createdBy } = req.body;

        // Check if lecture with same code already exists
        const existingLecture = await Lecture.findOne({ code });
        if (existingLecture) {
            return res.status(400).json({ message: 'A lecture with this code already exists' });
        }

        const newLecture = new Lecture({
            title,
            description,
            code,
            createdBy,
            participants: [createdBy]
        });

        const savedLecture = await newLecture.save();
        res.status(201).json(savedLecture);
    } catch (error) {
        console.error('Error creating lecture:', error);
        res.status(500).json({ message: 'Failed to create lecture', error: error.message });
    }
};

// Join a lecture using code
exports.joinLecture = async (req, res) => {
    try {
        const { code, userId } = req.body;

        const lecture = await Lecture.findOne({ code });
        if (!lecture) {
            return res.status(404).json({ message: 'Lecture not found with this code' });
        }

        // Check if user is already a participant
        if (lecture.participants.includes(userId)) {
            return res.status(200).json({ message: 'Already joined this lecture', lecture });
        }

        // Add user to participants
        lecture.participants.push(userId);
        await lecture.save();

        res.status(200).json(lecture);
    } catch (error) {
        console.error('Error joining lecture:', error);
        res.status(500).json({ message: 'Failed to join lecture', error: error.message });
    }
};

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
