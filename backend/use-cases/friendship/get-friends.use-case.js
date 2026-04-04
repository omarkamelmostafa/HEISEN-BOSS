// backend/use-cases/friendship/get-friends.use-case.js

import Friendship from "../../model/Friendship.js";
import User from "../../model/User.js";
import logger from "../../utilities/general/logger.js";

/**
 * Get Friends Use Case — Pure business logic, no req/res.
 * Returns accepted friendships where the current user is either requester or recipient.
 *
 * @param {Object} dto
 * @param {string} dto.userId — The current user ID
 * @returns {Object} { success, statusCode, message, data?, errorCode? }
 */
export async function getFriendsUseCase({ userId }) {
  try {
    // Validate current user exists and is active
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return {
        success: false,
        statusCode: 404,
        message: "User not found or deactivated.",
        errorCode: "USER_NOT_FOUND",
      };
    }

    // Query accepted friendships involving the current user in either direction
    const friendships = await Friendship.find({
      status: "accepted",
      $or: [
        { requester: userId },
        { recipient: userId },
      ],
    })
      .populate("requester", "firstname lastname")
      .populate("recipient", "firstname lastname")
      .sort({ createdAt: -1 });

    // Normalize the result into a friends array
    const friends = friendships.map((friendship) => {
      // Determine which side is the friend (not the current user)
      const isRequester = friendship.requester._id.toString() === userId;
      const friend = isRequester ? friendship.recipient : friendship.requester;

      return {
        _id: friendship._id,
        friend,
        createdAt: friendship.createdAt,
      };
    });

    return {
      success: true,
      statusCode: 200,
      message: "Friends retrieved successfully.",
      data: { friends },
    };
  } catch (error) {
    logger.error({ err: error, userId }, "Get friends use-case error");

    return {
      success: false,
      statusCode: 500,
      message: "Failed to retrieve friends.",
      errorCode: "GET_FRIENDS_FAILED",
    };
  }
}
