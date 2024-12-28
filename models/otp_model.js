import mongoose from "mongoose";

const OTPSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Link to the User model
    ref: "Users",
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  OTPExpiry: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const OTP = mongoose.model("OTP", OTPSchema);
