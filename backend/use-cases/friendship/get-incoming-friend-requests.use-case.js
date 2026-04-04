// backend/use-cases/friendship/get-incoming-friend-requests.use-case.js

import Friendship from "../../model/Friendship.js";
import User from "../../model/User.js";
import logger from "../../utilities/general/logger.js";

/**
 * Get Incoming Friend Requests Use Case — Pure business logic, no req/res.
 *
 * @param {Object} dto
 * @param {string} dto.userId — The current user ID
 * @returns {Object} { success, statusCode, message, data?, errorCode? }
 */
export async function getIncomingFriendRequestsUseCase({ userId }) {
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

    // Query incoming pending requests
    const requests = await Friendship.find({ recipient: userId, status: "pending" })
      .populate("requester", "firstname lastname")
      .sort({ createdAt: -1 });

    return {
      success: true,
      statusCode: 200,
      message: "Incoming friend requests retrieved successfully.",
      data: { requests: requests.map((request) => request.toJSON()) },
    };
  } catch (error) {
    logger.error({ err: error, userId }, "Get incoming friend requests use-case error");

    return {
      success: false,
      statusCode: 500,
      message: "Failed to retrieve incoming friend requests.",
      errorCode: "GET_INCOMING_FRIEND_REQUESTS_FAILED",
    };
  }
}
