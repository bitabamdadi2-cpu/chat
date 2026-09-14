import mongoose from "mongoose";
const mediaSchema = new mongoose.Schema(
  {
    file: {
      type: Object,
      required: [true, "file is required"],
    },
    type: {
      type: String,
      enum: ["image", "file", "video", "audio"],
      default: "image",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);
const Media = mongoose.model("Media", mediaSchema);
export default Media;
