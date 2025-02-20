const Post = require('../models/post.model');
const { sendSuccess, sendError, STATUS_CODES } = require('../utils/response.handler');
const { MESSAGES, ERROR_CODES } = require('../config/constants');

class PostController {
  // Create new post
  static async create(req, res) {
    try {
      const post = new Post({
        ...req.body,
        user: req.user._id
      });
      
      await post.save();
      await post.populate('user', 'name email');

      return sendSuccess(res, {
        statusCode: STATUS_CODES.CREATED.code,
        message: MESSAGES.POST.CREATED,
        data: { post }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to create post',
        errors: {
          code: ERROR_CODES.POST.INVALID_DATA,
          description: error.message
        }
      });
    }
  }

  // Get post by ID
  static async getById(req, res) {
    try {
      const post = await this.getPostWithInteractions(req.params.postId);
      
      if (!post) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: MESSAGES.POST.NOT_FOUND
        });
      }

      return sendSuccess(res, {
        message: 'Post fetched successfully',
        data: this.formatPostResponse(post)
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to fetch post',
        errors: {
          code: ERROR_CODES.POST.NOT_FOUND,
          description: error.message
        }
      });
    }
  }

  // Update post
  static async update(req, res) {
    try {
      const post = await Post.findOne({
        _id: req.params.postId,
        user: req.user._id
      });

      if (!post) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: MESSAGES.POST.NOT_FOUND
        });
      }

      Object.assign(post, req.body);
      await post.save();
      await post.populate('user', 'name email');

      return sendSuccess(res, {
        message: MESSAGES.POST.UPDATED,
        data: { post }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to update post',
        errors: {
          code: ERROR_CODES.POST.INVALID_DATA,
          description: error.message
        }
      });
    }
  }

  // Delete post
  static async delete(req, res) {
    try {
      const post = await Post.findOneAndDelete({
        _id: req.params.postId,
        user: req.user._id
      });

      if (!post) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: MESSAGES.POST.NOT_FOUND
        });
      }

      return sendSuccess(res, {
        message: MESSAGES.POST.DELETED
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to delete post',
        errors: {
          code: ERROR_CODES.POST.UNAUTHORIZED,
          description: error.message
        }
      });
    }
  }

  // Get post with interactions
  static async getPostWithInteractions(postId, populateFields = ['user', 'likes.user', 'shares.user']) {
    return Post.findById(postId).populate(populateFields.join(' '));
  }

  // Toggle like on post
  static async toggleLike(req, res) {
    try {
      const post = await this.getPostWithInteractions(req.params.postId);
      
      if (!post) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: MESSAGES.POST.NOT_FOUND,
          errors: {
            code: ERROR_CODES.POST.NOT_FOUND,
            description: 'The requested post does not exist'
          }
        });
      }

      const isLiked = post.likes.some(like => 
        like.user._id.toString() === req.user._id.toString()
      );

      if (isLiked) {
        post.likes = post.likes.filter(like => 
          like.user._id.toString() !== req.user._id.toString()
        );
        post.likesCount = Math.max(0, post.likesCount - 1);
      } else {
        post.likes.push({ 
          user: req.user._id,
          createdAt: new Date()
        });
        post.likesCount++;
      }

      await post.save();
      await post.populate('likes.user', 'name email');

      return sendSuccess(res, {
        message: isLiked ? MESSAGES.POST.UNLIKED : MESSAGES.POST.LIKED,
        data: this.formatPostResponse(post),
        metadata: {
          interactionStats: {
            totalLikes: post.likesCount,
            totalShares: post.sharesCount,
            lastUpdated: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      return sendError(res, {
        message: 'Like/unlike operation failed',
        errors: {
          code: ERROR_CODES.POST.UNAUTHORIZED,
          description: error.message
        }
      });
    }
  }

  // Format post response
  static formatPostResponse(post) {
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
          likes: {
            total: post.likesCount,
            recent: post.likes.slice(-3).map(like => ({
              user: {
                id: like.user._id,
                name: like.user.name,
                email: like.user.email
              },
              timestamp: like.createdAt
            }))
          },
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
          lastInteraction: new Date().toISOString()
        }
      }
    };
  }
}

module.exports = PostController; 