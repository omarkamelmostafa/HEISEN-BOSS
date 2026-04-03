// backend/validators/friendship-validators.js
import { body, param } from "express-validator";

export const sendFriendRequestValidationRules = [
  body("recipientId")
    .notEmpty()
    .withMessage("Recipient ID is required.")
    .bail()
    .isString()
    .withMessage("Recipient ID must be a string.")
    .bail()
    .isMongoId()
    .withMessage("Recipient ID must be a valid MongoDB ObjectId.")
    .trim(),
];

export const friendshipIdValidationRules = [
  param("friendshipId")
    .notEmpty()
    .withMessage("Friendship ID is required.")
    .bail()
    .isString()
    .withMessage("Friendship ID must be a string.")
    .bail()
    .isMongoId()
    .withMessage("Friendship ID must be a valid MongoDB ObjectId.")
    .trim(),
];
