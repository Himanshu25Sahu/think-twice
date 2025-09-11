import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: function () {
        return !this.googleId; // password only if not Google login
      },
    },
    googleId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: "https://i.ibb.co/placeholder-avatar.png",
    },
    bio: {
      type: String,
      maxlength: 200,
      default: "",
    },
    location: { type: String, default: "" },

    // 🔑 OTP login/verification
    otp: {
      code: { type: String, default: null },
      expiresAt: { type: Date, default: null },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // 📊 Social / app specific
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    decisions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Decision" }], // link to Decision model

    // ⚙️ Preferences
    notifications: {
      decisionReminders: { type: Boolean, default: true },
      socialUpdates: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
