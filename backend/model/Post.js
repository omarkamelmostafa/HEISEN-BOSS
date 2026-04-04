// backend/model/Post.js
import mongoose, { Schema } from "mongoose";

const PostSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required."],
      index: true,
    },
    content: {
      type: String,
      maxlength: [5000, "Post content cannot exceed 5000 characters."],
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    imagePublicId: {
      type: String,
      default: null,
    },
    isRepost: {
      type: Boolean,
      default: false,
    },
    originalPost: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    repostComment: {
      type: String,
      maxlength: [500, "Repost comment cannot exceed 500 characters."],
      trim: true,
      default: null,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    repostsCount: {
      type: Number,
      default: 0,
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
    toJSON: {
      transform: function (doc, ret) {
        delete ret.imagePublicId;
        return ret;
      },
    },
  }
);

// Indexes
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ isDeleted: 1, createdAt: -1 });
PostSchema.index({ originalPost: 1 });

const Post = mongoose.model("Post", PostSchema);
export default Post;
