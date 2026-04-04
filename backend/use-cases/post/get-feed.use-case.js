// backend/use-cases/post/get-feed.use-case.js

import mongoose from "mongoose";
import Post from "../../model/Post.js";
import Friendship from "../../model/Friendship.js";
import logger from "../../utilities/general/logger.js";

/**
 * Get Feed Use Case — Returns friends' posts with discovery fallback.
 *
 * @param {Object} dto
 * @param {string} dto.userId
 * @param {string} [dto.cursor]
 * @param {number} [dto.limit]
 * @returns {Object} { success, statusCode, message, data?, errorCode? }
 */
export async function getFeedUseCase({ userId, cursor, limit }) {
  try {
    // Normalize inputs
    const pageLimit = limit || 20;

    // Load accepted friendships
    const friendships = await Friendship.find({
      status: "accepted",
      $or: [{ requester: userId }, { recipient: userId }],
    }).lean();

    // Derive friendIds by selecting the "other user" for each friendship
    const friendIds = friendships.map((friendship) => {
      const requesterId = friendship.requester.toString();
      const recipientId = friendship.recipient.toString();
      return requesterId === userId ? recipientId : requesterId;
    });

    // Query friend posts
    const friendQuery = {
      isDeleted: false,
      author: { $in: friendIds },
    };

    if (cursor) {
      friendQuery._id = { $lt: cursor };
    }

    let posts = await Post.find(friendQuery)
      .sort({ _id: -1 })
      .limit(pageLimit + 1)
      .lean();

    // If no friend posts found, fallback to discovery
    if (posts.length === 0) {
      const discoveryExcludeIds = [
        new mongoose.Types.ObjectId(userId),
        ...friendIds.map((id) => new mongoose.Types.ObjectId(id)),
      ];

      const discoveryPipeline = [
        {
          $match: {
            isDeleted: false,
            author: { $nin: discoveryExcludeIds },
          },
        },
        { $sample: { size: pageLimit } },
      ];

      posts = await Post.aggregate(discoveryPipeline);

      return {
        success: true,
        statusCode: 200,
        message: "Feed loaded successfully (discovery mode).",
        data: {
          posts,
          nextCursor: null,
          hasMore: false,
        },
      };
    }

    // Determine pagination for friend posts
    const hasMore = posts.length > pageLimit;
    const resultPosts = hasMore ? posts.slice(0, pageLimit) : posts;
    const nextCursor = hasMore ? resultPosts[resultPosts.length - 1]._id.toString() : null;

    return {
      success: true,
      statusCode: 200,
      message: "Feed loaded successfully.",
      data: {
        posts: resultPosts,
        nextCursor,
        hasMore,
      },
    };
  } catch (error) {
    logger.error({ err: error, userId }, "Get feed use-case error");

    return {
      success: false,
      statusCode: 500,
      message: "Failed to load feed.",
      errorCode: "GET_FEED_FAILED",
    };
  }
}
