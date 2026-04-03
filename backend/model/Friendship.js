// backend/model/Friendship.js
import mongoose, { Schema } from "mongoose";

const FriendshipSchema = new Schema(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requester is required."],
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required."],
    },
    status: {
      type: String,
      required: true,
      default: "pending",
      enum: {
        values: ["pending", "accepted", "rejected", "blocked"],
        message: "Status must be pending, accepted, rejected, or blocked.",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
FriendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
FriendshipSchema.index({ recipient: 1, status: 1 });
FriendshipSchema.index({ requester: 1, status: 1 });

const Friendship = mongoose.model("Friendship", FriendshipSchema);
export default Friendship;
