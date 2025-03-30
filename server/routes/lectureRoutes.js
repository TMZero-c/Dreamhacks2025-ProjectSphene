const express = require('express');
const router = express.Router();
const lectureController = require('../controllers/lectureController');
const { protect } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(protect);

// GET /api/lectures/user - Get all lectures for the current user
router.get('/user', lectureController.getUserLectures);

// GET /api/lectures/:id - Get a specific lecture
router.get('/:id', lectureController.getLecture);

// POST /api/lectures - Create a new lecture
router.post('/', lectureController.createLecture);

// POST /api/lectures/join - Join a lecture using a code
router.post('/join', lectureController.joinLecture);

module.exports = router;
