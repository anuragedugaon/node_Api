const Post = require('../models/post.model');
const { sendSuccess, sendError, STATUS_CODES } = require('../utils/response.handler');
const { MESSAGES, ERROR_CODES } = require('../config/constants');

class InteractionController {
  static async getLikes(req, res) {
    try {
      const post = await Post.findById(req.params.postId)
        .populate('likes.user', 'name email');
      
      if (!post) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: MESSAGES.POST.NOT_FOUND
        });
      }

      return sendSuccess(res, {
        message: "Likes fetched successfully",
        data: {
          likes: post.likes.map(like => ({
            user: like.user,
            createdAt: like.createdAt
          })),
          totalLikes: post.likesCount
        }
      });
    } catch (error) {
      return sendError(res, {
        message: "Failed to fetch likes",
        errors: {
          code: ERROR_CODES.POST.FETCH_FAILED,
          description: error.message
        }
      });
    }
  }

  static async getShares(req, res) {
    try {
      const post = await Post.findById(req.params.postId)
        .populate('shares.user', 'name email');
      
      if (!post) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: MESSAGES.POST.NOT_FOUND
        });
      }

      return sendSuccess(res, {
        message: "Shares fetched successfully",
        data: {
          shares: post.shares.map(share => ({
            user: share.user,
            createdAt: share.createdAt
          })),
          totalShares: post.sharesCount
        }
      });
    } catch (error) {
      return sendError(res, {
        message: "Failed to fetch shares",
        errors: {
          code: ERROR_CODES.POST.FETCH_FAILED,
          description: error.message
        }
      });
    }
  }
}

module.exports = InteractionController; 