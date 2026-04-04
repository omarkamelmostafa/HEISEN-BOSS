// backend/use-cases/friendship/accept-friend-request.use-case.js

import Friendship from "../../model/Friendship.js";
import User from "../../model/User.js";
import logger from "../../utilities/general/logger.js";

/**
 * Accept Friend Request Use Case — Pure business logic, no req/res.
 * Allows the recipient of a pending friend request to accept it.
 *
 * @param {Object} dto
 * @param {string} dto.userId — The current user ID (must be recipient)
 * @param {string} dto.friendshipId — The friendship document ID
 * @returns {Object} { success, statusCode, message, data?, errorCode? }
 */
export async function acceptFriendRequestUseCase({ userId, friendshipId }) {
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

    // Authorization rule: only the recipient may accept
    if (friendship.recipient.toString() !== userId) {
      return {
        success: false,
        statusCode: 403,
        message: "You are not allowed to accept this friend request.",
        errorCode: "FRIEND_REQUEST_FORBIDDEN",
      };
    }

    // State rule: only pending requests can be accepted
    if (friendship.status !== "pending") {
      return {
        success: false,
        statusCode: 409,
        message: "Only pending friend requests can be accepted.",
        errorCode: "FRIEND_REQUEST_NOT_PENDING",
      };
    }

    // Update and save
    friendship.status = "accepted";
    await friendship.save();

    // Success return
    return {
      success: true,
      statusCode: 200,
      message: "Friend request accepted successfully.",
      data: { friendship: friendship.toJSON() },
    };
  } catch (error) {
    logger.error({ err: error, userId, friendshipId }, "Accept friend request use-case error");

    return {
      success: false,
      statusCode: 500,
      message: "Failed to accept friend request.",
      errorCode: "ACCEPT_FRIEND_REQUEST_FAILED",
    };
  }
}
