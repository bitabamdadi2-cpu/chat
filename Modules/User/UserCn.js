import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import User from "./UserMd.js";
import fs from "fs";
import Media from "../Media/MediaMd.js";
import { __dirname } from "../../app.js";
import Chat from "../Chat/ChatMd.js";
import Message from "../Message/MessageMd.js";
// search other users by username or phone number, used to start new chats
// and to add members to groups/channels from the frontend.
export const search = catchAsync(async (req, res, next) => {
  const { query = "" } = req.query;
  if (!query || query.trim().length < 1) {
    return res.status(200).json({ success: true, message: "search users", data: [] });
  }
  const regex = new RegExp(query.trim(), "i");
  const users = await User.find({
    _id: { $ne: req.userId },
    $or: [{ username: regex }, { phoneNumber: regex }],
  })
    .select("username phoneNumber bio profilePictureId")
    .limit(20)
    .populate("profilePictureId");
  return res.status(200).json({
    success: true,
    message: "search users",
    data: users,
  });
});

export const getOne = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(User, req.query, req?.role)
    .addManualFilters({ _id: req.userId })
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate({ path: "profilePictureId" });
  const result = await features.execute();
  return res.status(200).json(result);
});
export const update = catchAsync(async (req, res, next) => {
  const { phoneNumber = null, chatIds = null, ...otherData } = req.body;
  const newUser = await User.findByIdAndUpdate(req.userId, otherData, {
    new: true,
    runValidators: true,
  }).populate({ path: "profilePictureId" });
  return res.status(200).json({
    success: true,
    message: "user Updated successfully",
    data: newUser,
  });
});

export const remove = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.userId);
  if (user.profilePictureId) {
    const profilePicture = await Media.findByIdAndDelete(user.profilePictureId);
    if (fs.existsSync(`${__dirname}/Public/${profilePicture.file.filename}`)) {
      fs.unlinkSync(`${__dirname}/Public/${profilePicture.file.filename}`);
    }
  }
  const chats = await Chat.find({ ownerId: req.userId });
  const memberChats = await Chat.find({
    memberIds: req.userId,
    ownerId: { $ne: req.userId },
  });
  for (const chat of memberChats) {
    chat.memberIds = chat.memberIds.filter(
      (id) => id.toString() !== req.userId,
    );
    chat.adminIds = chat.adminIds.filter((id) => id.toString() !== req.userId);
    await chat.save();
  }
  if (chats.length > 0) {
    for (const chat of chats) {
      const messages = await Message.find({ chatId: chat._id });
      for (const message of messages) {
        if (message.mediaId) {
          const media = await Media.findByIdAndDelete(message.mediaId);
          if (media && fs.existsSync(`${__dirname}/Public/${media.file.filename}`)) {
            fs.unlinkSync(`${__dirname}/Public/${media.file.filename}`);
          }
        }
      }
      await Message.deleteMany({ chatId: chat._id });
    }
    await Chat.deleteMany({ ownerId: req.userId });
  }
  return res.status(200).json({
    success: true,
    message: "user deleted successfully",
  });
});
