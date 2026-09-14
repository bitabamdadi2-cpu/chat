import mongoose from "mongoose";
const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    mediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required:[true,"user id is required"]
    },
    replyToMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    content: {
      type: String,
      default: "",
    }
  },
  { timestamps: true },
);
const Message = mongoose.model("Message", messageSchema);
export default Message;
