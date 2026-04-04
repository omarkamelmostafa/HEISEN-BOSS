// backend/use-cases/friendship/send-friend-request.use-case.js

import Friendship from "../../model/Friendship.js";
import User from "../../model/User.js";
import logger from "../../utilities/general/logger.js";

/**
 * Send Friend Request Use Case — Pure business logic, no req/res.
 *
 * @param {Object} dto
 * @param {string} dto.userId — The requester (sender) user ID
 * @param {string} dto.recipientId — The recipient user ID
 * @returns {Object} { success, statusCode, message, data?, errorCode? }
 */
export async function sendFriendRequestUseCase({ userId, recipientId }) {
  try {
    // Validate sender exists and is active
    const sender = await User.findById(userId);
    if (!sender || !sender.isActive) {
      return {
        success: false,
        statusCode: 404,
        message: "User not found or deactivated.",
        errorCode: "USER_NOT_FOUND",
      };
    }

    // Prevent self-request
    if (userId === recipientId) {
      return {
        success: false,
        statusCode: 400,
        message: "You cannot send a friend request to yourself.",
        errorCode: "INVALID_FRIEND_REQUEST",
      };
    }

    // Validate recipient exists and is active
    const recipient = await User.findById(recipientId);
    if (!recipient || !recipient.isActive) {
      return {
        success: false,
        statusCode: 404,
        message: "Recipient not found or deactivated.",
        errorCode: "RECIPIENT_NOT_FOUND",
      };
    }

    // Check for any existing relationship in either direction
    const existingFriendship = await Friendship.findOne({
      $or: [
        { requester: userId, recipient: recipientId },
        { requester: recipientId, recipient: userId },
      ],
    });

    if (existingFriendship) {
      // Handle existing relationship states
      if (existingFriendship.status === "accepted") {
        return {
          success: false,
          statusCode: 409,
          message: "You are already friends with this user.",
          errorCode: "ALREADY_FRIENDS",
        };
      }

      if (existingFriendship.status === "pending") {
        return {
          success: false,
          statusCode: 409,
          message: "A friend request already exists between these users.",
          errorCode: "FRIEND_REQUEST_EXISTS",
        };
      }

      if (existingFriendship.status === "blocked") {
        return {
          success: false,
          statusCode: 403,
          message: "You cannot send a friend request to this user.",
          errorCode: "FRIEND_REQUEST_BLOCKED",
        };
      }

      if (existingFriendship.status === "rejected") {
        return {
          success: false,
          statusCode: 409,
          message: "A previous friend request already exists between these users.",
          errorCode: "FRIEND_REQUEST_EXISTS",
        };
      }
    }

    // No existing relationship, create new pending friendship
    const friendship = await Friendship.create({
      requester: userId,
      recipient: recipientId,
      status: "pending",
    });

    return {
      success: true,
      statusCode: 201,
      message: "Friend request sent successfully.",
      data: { friendship: friendship.toJSON() },
    };
  } catch (error) {
    logger.error({ err: error, userId, recipientId }, "Send friend request use-case error");

    return {
      success: false,
      statusCode: 500,
      message: "Failed to send friend request.",
      errorCode: "SEND_FRIEND_REQUEST_FAILED",
    };
  }
}
