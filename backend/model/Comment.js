// backend/model/Comment.js
import mongoose, { Schema } from "mongoose";

const CommentSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required."],
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Post reference is required."],
      index: true,
    },
    content: {
      type: String,
      required: [true, "Comment content is required."],
      maxlength: [2000, "Comment cannot exceed 2000 characters."],
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CommentSchema.index({ post: 1, createdAt: 1 });

const Comment = mongoose.model("Comment", CommentSchema);
export default Comment;
