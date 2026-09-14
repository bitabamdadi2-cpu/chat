import mongoose from "mongoose";
const chatSchema = new mongoose.Schema(
  {
    memberPrivateIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    memberIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    adminIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    lastMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    profilePictureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },
    bio: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["private", "group", "channel"],
      default: "private",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    title: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);
const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
