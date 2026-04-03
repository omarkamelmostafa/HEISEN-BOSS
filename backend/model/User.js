// backend/model/User.js
import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const emailValidator = (email) => {
  const regex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regex.test(email);
};

const UserSchema = new Schema(
  {
    firstname: {
      type: String,
      required: [true, "First name is required."],
      minlength: [3, "First name must be at least 3 characters long."],
      maxlength: [16, "First name must be at most 16 characters long."],
      trim: true,
    },
    lastname: {
      type: String,
      required: [true, "Last name is required."],
      minlength: [3, "Last name must be at least 3 characters long."],
      maxlength: [16, "Last name must be at most 16 characters long."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      maxlength: [100, "Email must be at most 100 characters long."],
      unique: true,
      validate: [emailValidator, "Please provide a valid email address."],
      lowercase: true,
      trim: true,
    },
    avatar: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [8, "Password must be at least 8 characters long."],
      select: false, // Never return password in queries by default
    },

    // Enhanced security fields for login system
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Token fields (refresh tokens are now in the RefreshToken collection)
    resetPasswordToken: {
      type: String,
      select: false,
      index: true,
      sparse: true,
    },
    resetPasswordExpiresAt: {
      type: Date,
      select: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorCode: {
      type: String,
      select: false,
    },

    twoFactorExpiry: {
      type: Date,
      select: false,
    },

    pendingEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },
    pendingEmailToken: {
      type: String,
      select: false,
      default: null,
    },
    pendingEmailExpiresAt: {
      type: Date,
      select: false,
      default: null,
    },
    verificationToken: {
      type: String,
      select: false,
      index: true,
      sparse: true,
    },
    verificationTokenExpiresAt: {
      type: Date,
      select: false,
    },
    termsAcceptedAt: {
      type: Date,
      default: null,
    },
    tokenVersion: {
      type: Number,
      default: 1,
      select: false,
    },

    // Security identifier
    uuid: {
      type: String,
      default: uuidv4,
      unique: true,
    },

    // Timestamps
    lastPasswordChange: {
      type: Date,
      select: false,
    },
    lastSecurityEvent: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        // Always remove password and sensitive fields when converting to JSON
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.verificationToken;
        return ret;
      },
    },
  }
);

UserSchema.pre("save", function (next) {
  if (this.isModified("password")) {
    this.tokenVersion += 1; // ← INCREMENT
    this.lastPasswordChange = new Date();
    this.lastSecurityEvent = new Date();
  }
  if (this.isModified("email") || this.isModified("isActive")) {
    this.lastSecurityEvent = new Date();
  }
  next();
}); // ::TODO:: three cases, password change, log out all devices, admin security action

// Note: Session invalidation on sensitive data changes is now handled
// via tokenVersion increment (already in the pre-save hook above).
// Refresh tokens are in the RefreshToken collection and are invalidated
// by comparing tokenVersion at refresh time.

// Static method to find by email including security fields
UserSchema.statics.findByEmailWithSecurity = function (email) {
  return this.findOne({ email }).select(
    "+password +tokenVersion"
  );
};

// Optimization Indexes
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ verificationToken: 1, isVerified: 1 });
UserSchema.index({ resetPasswordToken: 1, isActive: 1 });
UserSchema.index({ pendingEmailToken: 1 }, { sparse: true });


const User = mongoose.model("User", UserSchema);
export default User;


