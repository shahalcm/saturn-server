const EducationCourse = require('../models/EducationCourse');
const { successResponse, errorResponse } = require('../utils/formatResponse');

// @GET /api/education
const getCourses = async (req, res) => {
  try {
    const { religion, level, subject, search, limit = 20, page = 1 } = req.query;
    const filter = { isActive: true };

    if (religion) filter.religion = religion;
    if (level) filter.level = level;
    if (subject) filter.subjects = { $in: [subject] };
    if (search) filter.title = { $regex: search, $options: 'i' };

    const total = await EducationCourse.countDocuments(filter);
    const courses = await EducationCourse.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return successResponse(res, {
      courses,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/education/:id
const getCourseById = async (req, res) => {
  try {
    const course = await EducationCourse.findById(req.params.id);
    if (!course) return errorResponse(res, 'Course not found', 404);
    return successResponse(res, course);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/education
const createCourse = async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      instructorId: req.userType === 'provider' ? req.userId : undefined,
    };
    const course = await EducationCourse.create(courseData);
    return successResponse(res, course, 'Course created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/education/:id
const updateCourse = async (req, res) => {
  try {
    const course = await EducationCourse.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return errorResponse(res, 'Course not found', 404);
    return successResponse(res, course, 'Course updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @DELETE /api/education/:id
const deleteCourse = async (req, res) => {
  try {
    const course = await EducationCourse.findByIdAndDelete(req.params.id);
    if (!course) return errorResponse(res, 'Course not found', 404);
    return successResponse(res, null, 'Course deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/education/:id/enroll
const enrollStudent = async (req, res) => {
  try {
    const course = await EducationCourse.findByIdAndUpdate(
      req.params.id,
      { $inc: { totalStudents: 1 } },
      { new: true }
    );
    if (!course) return errorResponse(res, 'Course not found', 404);
    return successResponse(res, { totalStudents: course.totalStudents }, 'Student enrolled successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, enrollStudent };
