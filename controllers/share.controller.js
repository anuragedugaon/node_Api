const Post = require('../models/post.model');
const { sendSuccess, sendError, STATUS_CODES } = require('../utils/response.handler');
const { MESSAGES, ERROR_CODES } = require('../config/constants');

class ShareController {
  static async sharePost(req, res) {
    try {
      const post = await Post.findById(req.params.postId)
        .populate('user', 'name email')
        .populate('shares.user', 'name email');
      
      if (!post) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: MESSAGES.POST.NOT_FOUND,
          errors: {
            code: ERROR_CODES.POST.NOT_FOUND,
            description: 'Post does not exist'
          }
        });
      }

      post.shares.push({ 
        user: req.user._id,
        createdAt: new Date()
      });
      post.sharesCount++;

      await post.save();
      await post.populate('shares.user', 'name email');

      return sendSuccess(res, {
        message: MESSAGES.POST.SHARED,
        data: this.formatShareResponse(post),
        metadata: {
          shareStats: {
            totalShares: post.sharesCount,
            lastShared: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      return sendError(res, {
        message: 'Share operation failed',
        errors: {
          code: ERROR_CODES.POST.UNAUTHORIZED,
          description: error.message
        }
      });
    }
  }

  static formatShareResponse(post) {
    return {
      post: {
        id: post._id,
        title: post.title,
        description: post.description,
        image: post.image,
        author: {
          id: post.user._id,
          name: post.user.name,
          email: post.user.email
        },
        stats: {
          shares: {
            total: post.sharesCount,
            recent: post.shares.slice(-3).map(share => ({
              user: {
                id: share.user._id,
                name: share.user.name,
                email: share.user.email
              },
              timestamp: share.createdAt
            }))
          }
        },
        timestamps: {
          created: post.createdAt,
          lastShared: new Date().toISOString()
        }
      }
    };
  }
}

module.exports = ShareController; 