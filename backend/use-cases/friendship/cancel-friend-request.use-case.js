// backend/use-cases/friendship/cancel-friend-request.use-case.js

import Friendship from "../../model/Friendship.js";
import User from "../../model/User.js";
import logger from "../../utilities/general/logger.js";

/**
 * Cancel Friend Request Use Case — Pure business logic, no req/res.
 * Allows the requester of a pending friend request to cancel it by hard deleting.
 *
 * @param {Object} dto
 * @param {string} dto.userId — The current user ID (must be requester)
 * @param {string} dto.friendshipId — The friendship document ID
 * @returns {Object} { success, statusCode, message, data?, errorCode? }
 */
export async function cancelFriendRequestUseCase({ userId, friendshipId }) {
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

    // Find the friendship by id
    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return {
        success: false,
        statusCode: 404,
        message: "Friend request not found.",
        errorCode: "FRIEND_REQUEST_NOT_FOUND",
      };
    }

    // Authorization rule: only the requester may cancel
    if (friendship.requester.toString() !== userId) {
      return {
        success: false,
        statusCode: 403,
        message: "You are not allowed to cancel this friend request.",
        errorCode: "FRIEND_REQUEST_FORBIDDEN",
      };
    }

    // State rule: only pending requests can be canceled
    if (friendship.status !== "pending") {
      return {
        success: false,
        statusCode: 409,
        message: "Only pending friend requests can be canceled.",
        errorCode: "FRIEND_REQUEST_NOT_PENDING",
      };
    }

    // Hard delete
    await friendship.deleteOne();

    // Success return
    return {
      success: true,
      statusCode: 200,
      message: "Friend request canceled successfully.",
      data: { friendshipId },
    };
  } catch (error) {
    logger.error({ err: error, userId, friendshipId }, "Cancel friend request use-case error");

    return {
      success: false,
      statusCode: 500,
      message: "Failed to cancel friend request.",
      errorCode: "CANCEL_FRIEND_REQUEST_FAILED",
    };
  }
}
