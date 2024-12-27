import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: "",
  },
  occupation: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["admin", "client"],
    default: "client",
  },
  joinedDate: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  OTP: {
    type: String,
    default: "",
  },
  OTPExpiry: {
    type: Date,
    default: null,
  },
});

const Users = mongoose.model("Users", userSchema);

export default Users;
