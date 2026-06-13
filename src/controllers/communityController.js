const Community = require('../models/Community');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/formatResponse');

// @POST /api/community
const createPost = async (req, res) => {
  try {
    const { content, religion } = req.body;
    if (!content) return errorResponse(res, 'Content is required');

    let authorName = 'Anonymous';
    if (req.user) {
      authorName = req.user.name;
    } else if (req.provider) {
      authorName = req.provider.name;
    }

    const post = await Community.create({
      authorId: req.userId,
      authorName,
      content,
      religion,
    });

    return successResponse(res, post, 'Post created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @GET /api/community
const getPosts = async (req, res) => {
  try {
    const { religion, page = 1, limit = 20 } = req.query;
    const filter = { isHidden: false, isDeleted: false };

    if (religion) filter.religion = religion;

    const total = await Community.countDocuments(filter);
    const posts = await Community.find(filter)
      .populate('authorId', 'name avatar role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return successResponse(res, {
      posts,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/community/:id/like
const likePost = async (req, res) => {
  try {
    const post = await Community.findById(req.params.id);
    if (!post) return errorResponse(res, 'Post not found', 404);

    const index = post.likes.indexOf(req.userId);
    if (index === -1) {
      post.likes.push(req.userId);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    return successResponse(res, { likesCount: post.likes.length, isLiked: index === -1 }, 'Like status updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/community/:id/comment
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return errorResponse(res, 'Comment text is required');

    const post = await Community.findById(req.params.id);
    if (!post) return errorResponse(res, 'Post not found', 404);

    let name = 'Anonymous';
    if (req.user) name = req.user.name;
    else if (req.provider) name = req.provider.name;

    const comment = {
      userId: req.userId,
      name,
      text,
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

    return successResponse(res, post.comments[post.comments.length - 1], 'Comment added successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @POST /api/community/:id/report
const reportPost = async (req, res) => {
  try {
    const post = await Community.findByIdAndUpdate(
      req.params.id,
      { isReported: true, $inc: { reportCount: 1 } },
      { new: true }
    );
    if (!post) return errorResponse(res, 'Post not found', 404);
    return successResponse(res, { reportCount: post.reportCount }, 'Post reported successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// @DELETE /api/community/:id
const deletePost = async (req, res) => {
  try {
    const post = await Community.findById(req.params.id);
    if (!post) return errorResponse(res, 'Post not found', 404);

    // Only author or admin can delete
    if (post.authorId.toString() !== req.userId && req.userRole !== 'admin') {
      return errorResponse(res, 'Unauthorized action', 403);
    }

    post.isDeleted = true;
    await post.save();

    return successResponse(res, null, 'Post deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { createPost, getPosts, likePost, addComment, reportPost, deletePost };
