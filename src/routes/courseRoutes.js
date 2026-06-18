const express = require('express');
const router = express.Router();
const { protect, adminProtect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  createCourse, getMyCourses, updateCourse,
  deleteCourse, enrollCourse, getPublicCourses,
  adminApproveCourse, adminGetCourses,
  getEnrolledCourses,
} = require('../controllers/courseController');

// Public
router.get('/', getPublicCourses);

// Seeker routes
router.get('/enrolled/me', protect, getEnrolledCourses);

// Provider routes
router.post('/', protect, upload.single('thumbnail'), createCourse);
router.get('/my', protect, getMyCourses);
router.put('/:id', protect, upload.single('thumbnail'), updateCourse);
router.delete('/:id', protect, deleteCourse);
router.post('/:id/enroll', protect, enrollCourse);

// Admin routes
router.get('/admin/all', adminProtect, adminGetCourses);
router.put('/admin/:id/approve', adminProtect, adminApproveCourse);

module.exports = router;
