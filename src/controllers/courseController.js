const ProviderCourse = require('../models/ProviderCourse');
const CourseEnrollment = require('../models/CourseEnrollment');
const Provider = require('../models/Provider');
const User = require('../models/User');
const Commission = require('../models/Commission');
const { successResponse, errorResponse } = require('../utils/formatResponse');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @POST /api/courses — provider creates course
const createCourse = async (req, res) => {
  try {
    const {
      title, description, category, level,
      price, isFree, duration, totalWeeks,
      maxStudents, curriculum, whatYouLearn, requirements,
    } = req.body;

    if (!title || !description || !category) {
      return errorResponse(res, 'Title, description and category are required');
    }

    const provider = await Provider.findById(req.userId);
    if (!provider) return errorResponse(res, 'Provider not found');
    if (provider.verificationStatus !== 'verified') {
      return errorResponse(res, 'Only verified providers can create courses');
    }

    const commissionConfig = await Commission.findOne();
    const commissionRate = commissionConfig?.courseCommission || 5;

    let thumbnailUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'saturn/courses',
        width: 800,
        crop: 'scale',
      });
      thumbnailUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const course = await ProviderCourse.create({
      providerId: req.userId,
      providerName: provider.name,
      providerType: provider.providerType,
      religion: provider.religion,
      title,
      description,
      category,
      level: level || 'All levels',
      price: isFree === 'true' || isFree === true ? 0 : (Number(price) || 0),
      isFree: isFree === true || isFree === 'true',
      duration,
      totalWeeks: Number(totalWeeks) || 4,
      maxStudents: Number(maxStudents) || 50,
      thumbnail: thumbnailUrl,
      curriculum: curriculum ? JSON.parse(curriculum) : [],
      whatYouLearn: whatYouLearn ? JSON.parse(whatYouLearn) : [],
      requirements: requirements ? JSON.parse(requirements) : [],
      commissionRate,
      isApproved: 'pending',
    });

    return successResponse(res, course, 'Course created and pending approval', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/courses/my — provider's own courses
const getMyCourses = async (req, res) => {
  try {
    const courses = await ProviderCourse.find({ providerId: req.userId })
      .sort({ createdAt: -1 });
    return successResponse(res, courses);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @PUT /api/courses/:id — update course
const updateCourse = async (req, res) => {
  try {
    const course = await ProviderCourse.findOne({
      _id: req.params.id,
      providerId: req.userId,
    });
    if (!course) return errorResponse(res, 'Course not found', 404);

    let thumbnailUrl = course.thumbnail;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'saturn/courses',
        width: 800,
        crop: 'scale',
      });
      thumbnailUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const { curriculum, whatYouLearn, requirements, isFree, price, ...otherFields } = req.body;

    const updateData = {
      ...otherFields,
      thumbnail: thumbnailUrl,
    };

    // Only reset approval to pending if critical billing/content details are modified
    const isCriticalUpdate = req.file || req.body.title || req.body.description || price !== undefined || curriculum || isFree !== undefined;
    if (isCriticalUpdate) {
      updateData.isApproved = 'pending';
    }

    if (curriculum) updateData.curriculum = JSON.parse(curriculum);
    if (whatYouLearn) updateData.whatYouLearn = JSON.parse(whatYouLearn);
    if (requirements) updateData.requirements = JSON.parse(requirements);
    if (isFree !== undefined) {
      updateData.isFree = isFree === true || isFree === 'true';
      updateData.price = updateData.isFree ? 0 : (Number(price) || 0);
    } else if (price !== undefined) {
      updateData.price = Number(price) || 0;
    }

    const updated = await ProviderCourse.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    return successResponse(res, updated, 'Course updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @DELETE /api/courses/:id
const deleteCourse = async (req, res) => {
  try {
    await ProviderCourse.findOneAndDelete({
      _id: req.params.id,
      providerId: req.userId,
    });
    return successResponse(res, null, 'Course deleted');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/courses/:id/enroll — seeker enrolls
const enrollCourse = async (req, res) => {
  try {
    const { paymentId } = req.body;
    const course = await ProviderCourse.findById(req.params.id);
    if (!course) return errorResponse(res, 'Course not found', 404);
    if (course.isApproved !== 'approved') {
      return errorResponse(res, 'Course not available');
    }

    const existing = await CourseEnrollment.findOne({
      courseId: req.params.id,
      seekerId: req.userId,
    });
    if (existing) return errorResponse(res, 'Already enrolled');

    const commissionAmount = Math.round((course.price * course.commissionRate) / 100);
    const providerEarning = course.price - commissionAmount;

    const enrollment = await CourseEnrollment.create({
      courseId: course._id,
      seekerId: req.userId,
      providerId: course.providerId,
      amountPaid: course.price,
      commissionAmount,
      providerEarning,
      paymentId,
    });

    // Update course stats
    await ProviderCourse.findByIdAndUpdate(course._id, {
      $inc: {
        enrolledStudents: 1,
        totalRevenue: course.price,
        totalCommissionPaid: commissionAmount,
      },
    });

    // Add earning to provider wallet
    if (providerEarning > 0) {
      await Provider.findByIdAndUpdate(course.providerId, {
        $inc: { walletBalance: providerEarning, totalEarned: providerEarning },
      });
    }

    // Deduct from seeker wallet
    if (course.price > 0) {
      await User.findByIdAndUpdate(req.userId, {
        $inc: { walletBalance: -course.price, totalSpent: course.price },
      });
    }

    return successResponse(res, enrollment, 'Enrolled successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/courses — public: get approved courses by religion
const getPublicCourses = async (req, res) => {
  try {
    const { religion, category, level } = req.query;
    const filter = { isApproved: 'approved', isActive: true };
    if (religion) filter.religion = religion;
    if (category) filter.category = category;
    if (level) filter.level = level;

    const courses = await ProviderCourse.find(filter).sort({ createdAt: -1 });
    return successResponse(res, courses);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// ADMIN: approve/reject course
const adminApproveCourse = async (req, res) => {
  try {
    const { status } = req.body;
    const course = await ProviderCourse.findByIdAndUpdate(
      req.params.id,
      { isApproved: status },
      { new: true }
    );
    return successResponse(res, course, `Course ${status}`);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// ADMIN: get all courses
const adminGetCourses = async (req, res) => {
  try {
    const { isApproved, religion, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (isApproved) filter.isApproved = isApproved;
    if (religion) filter.religion = religion;

    const courses = await ProviderCourse.find(filter)
      .populate('providerId', 'name phone providerType')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ProviderCourse.countDocuments(filter);
    return successResponse(res, { courses, total });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/courses/enrolled/me — get list of courses seeker is enrolled in
const getEnrolledCourses = async (req, res) => {
  try {
    const enrollments = await CourseEnrollment.find({ seekerId: req.userId }).select('courseId');
    const courseIds = enrollments.map(e => e.courseId.toString());
    return successResponse(res, courseIds);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  createCourse,
  getMyCourses,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getPublicCourses,
  adminApproveCourse,
  adminGetCourses,
  getEnrolledCourses,
};
