// backend/use-cases/friendship/unfriend.use-case.js

import Friendship from "../../model/Friendship.js";
import User from "../../model/User.js";
import logger from "../../utilities/general/logger.js";

/**
 * Unfriend Use Case — Pure business logic, no req/res.
 * Hard-deletes an accepted friendship when initiated by either participant.
 *
 * @param {Object} dto
 * @param {string} dto.userId — The current user ID (must be requester or recipient)
 * @param {string} dto.friendshipId — The friendship document ID
 * @returns {Object} { success, statusCode, message, data?, errorCode? }
 */
export async function unfriendUseCase({ userId, friendshipId }) {
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

    // Find friendship by id
    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return {
        success: false,
        statusCode: 404,
        message: "Friendship not found.",
        errorCode: "FRIENDSHIP_NOT_FOUND",
      };
    }

    // Authorization rule: either participant may unfriend
    if (
      friendship.requester.toString() !== userId &&
      friendship.recipient.toString() !== userId
    ) {
      return {
        success: false,
        statusCode: 403,
        message: "You are not allowed to unfriend this user.",
        errorCode: "FRIENDSHIP_FORBIDDEN",
      };
    }

    // State rule: only accepted friendships can be unfriended
    if (friendship.status !== "accepted") {
      return {
        success: false,
        statusCode: 409,
        message: "Only accepted friendships can be removed.",
        errorCode: "FRIENDSHIP_NOT_ACCEPTED",
      };
    }

    // Hard delete
    await friendship.deleteOne();

    // Success return
    return {
      success: true,
      statusCode: 200,
      message: "Friend removed successfully.",
      data: { friendshipId },
    };
  } catch (error) {
    logger.error({ err: error, userId, friendshipId }, "Unfriend use-case error");

    return {
      success: false,
      statusCode: 500,
      message: "Failed to remove friend.",
      errorCode: "UNFRIEND_FAILED",
    };
  }
}
