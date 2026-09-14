import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      unique: [true, "phone number already exist"],
      required: [true, "phone number is required"],
    },
    username: {
      type: String,
      required: [true, "username is required"],
      unique: [true, "username already exist"],
    },
    bio: {
      type: String,
      default: "",
    },
    profilePictureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },
    birthDate: {
      type: Date,
      default: null,
    },
    chatIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Chat",
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);
const User = mongoose.model("User", userSchema);
export default User;
