const express = require('express');
const { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, enrollStudent } = require('../controllers/educationController');
const { protect, adminProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', protect, createCourse);
router.put('/:id', protect, updateCourse);
router.delete('/:id', adminProtect, deleteCourse);
router.post('/:id/enroll', protect, enrollStudent);

module.exports = router;
