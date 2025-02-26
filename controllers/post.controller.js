const Post = require('../models/post.model');
const { ResponseHandler, STATUS_CODES } = require('../utils/response.handler');
const { sendSuccess, sendError } = ResponseHandler;

class PostController {
  // Create new post
  static async createPost(req, res) {
    try {
      const { title, description } = req.body;
      const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : null;

      const post = new Post({
        title,
        description,
        image: imageUrl,
        author: req.user._id
      });

      await post.save();
      await post.populate('author', 'name email');

      return sendSuccess(res, {
        statusCode: STATUS_CODES.CREATED.code,
        message: 'Post created successfully',
        data: { post }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to create post',
        errors: { description: error.message }
      });
    }
  }

  // Get all posts
  static async getAllPosts(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const posts = await Post.find()
        .populate('author', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Post.countDocuments();

      return sendSuccess(res, {
        message: 'Posts fetched successfully',
        data: {
          posts,
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to fetch posts',
        errors: { description: error.message }
      });
    }
  }

  // Get post by ID
  static async getPostById(req, res) {
    try {
      const post = await Post.findById(req.params.postId)
        .populate('author', 'name email');

      if (!post) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: 'Post not found'
        });
      }

      return sendSuccess(res, {
        message: 'Post fetched successfully',
        data: { post }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to fetch post',
        errors: { description: error.message }
      });
    }
  }

  // Update post
  static async updatePost(req, res) {
    try {
      const { title, description } = req.body;
      const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : undefined;

      const post = await Post.findById(req.params.postId);

      if (!post) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: 'Post not found'
        });
      }

      if (post.author.toString() !== req.user._id.toString()) {
        return sendError(res, {
          statusCode: STATUS_CODES.FORBIDDEN.code,
          message: 'Not authorized to update this post'
        });
      }

      const updatedPost = await Post.findByIdAndUpdate(
        req.params.postId,
        {
          title,
          description,
          ...(imageUrl && { image: imageUrl })
        },
        { new: true }
      ).populate('author', 'name email');

      return sendSuccess(res, {
        message: 'Post updated successfully',
        data: { post: updatedPost }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to update post',
        errors: { description: error.message }
      });
    }
  }

  // Delete post
  static async deletePost(req, res) {
    try {
      const post = await Post.findById(req.params.postId);

      if (!post) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: 'Post not found'
        });
      }

      if (post.author.toString() !== req.user._id.toString()) {
        return sendError(res, {
          statusCode: STATUS_CODES.FORBIDDEN.code,
          message: 'Not authorized to delete this post'
        });
      }

      await post.remove();

      return sendSuccess(res, {
        message: 'Post deleted successfully'
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to delete post',
        errors: { description: error.message }
      });
    }
  }

  // Like/Unlike post
  static async likePost(req, res) {
    try {
      const post = await Post.findById(req.params.postId);
      
      if (!post) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: 'Post not found'
        });
      }

      const likeIndex = post.likes.indexOf(req.user._id);

      if (likeIndex === -1) {
        // Like post
        post.likes.push(req.user._id);
        await post.save();
        
        return sendSuccess(res, {
          message: 'Post liked successfully'
        });
      } else {
        // Unlike post
        post.likes.splice(likeIndex, 1);
        await post.save();
        
        return sendSuccess(res, {
          message: 'Post unliked successfully'
        });
      }
    } catch (error) {
      return sendError(res, {
        message: 'Failed to like/unlike post',
        errors: { description: error.message }
      });
    }
  }

  // Share post
  static async sharePost(req, res) {
    try {
      const post = await Post.findById(req.params.postId);
      
      if (!post) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: 'Post not found'
        });
      }

      post.shares.push(req.user._id);
      await post.save();

      return sendSuccess(res, {
        message: 'Post shared successfully'
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to share post',
        errors: { description: error.message }
      });
    }
  }

  // Get post likes
  static async getPostLikes(req, res) {
    try {
      const post = await Post.findById(req.params.postId)
        .populate('likes', 'name email');

      if (!post) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: 'Post not found'
        });
      }

      return sendSuccess(res, {
        message: 'Post likes fetched successfully',
        data: { likes: post.likes }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to fetch post likes',
        errors: { description: error.message }
      });
    }
  }

  // Get post shares
  static async getPostShares(req, res) {
    try {
      const post = await Post.findById(req.params.postId)
        .populate('shares', 'name email');

      if (!post) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: 'Post not found'
        });
      }

      return sendSuccess(res, {
        message: 'Post shares fetched successfully',
        data: { shares: post.shares }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to fetch post shares',
        errors: { description: error.message }
      });
    }
  }

  // Add comment to post
  static async addComment(req, res) {
    try {
      const { content } = req.body;
      const post = await Post.findById(req.params.postId);

      if (!post) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: 'Post not found'
        });
      }

      const comment = {
        content,
        author: req.user._id,
        createdAt: new Date()
      };

      post.comments.push(comment);
      await post.save();

      return sendSuccess(res, {
        message: 'Comment added successfully',
        data: { comment }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to add comment',
        errors: { description: error.message }
      });
    }
  }

  // Get post comments
  static async getComments(req, res) {
    try {
      const post = await Post.findById(req.params.postId)
        .populate({
          path: 'comments.author',
          select: 'name email'
        });

      if (!post) {
        return sendError(res, {
          statusCode: STATUS_CODES.NOT_FOUND.code,
          message: 'Post not found'
        });
      }

      return sendSuccess(res, {
        message: 'Comments fetched successfully',
        data: { comments: post.comments }
      });
    } catch (error) {
      return sendError(res, {
        message: 'Failed to fetch comments',
        errors: { description: error.message }
      });
    }
  }
}

module.exports = PostController; 