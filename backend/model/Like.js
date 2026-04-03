// backend/model/Like.js
import mongoose, { Schema } from "mongoose";

const LikeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required."],
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Post reference is required."],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
LikeSchema.index({ user: 1, post: 1 }, { unique: true });
LikeSchema.index({ post: 1 });

const Like = mongoose.model("Like", LikeSchema);
export default Like;
