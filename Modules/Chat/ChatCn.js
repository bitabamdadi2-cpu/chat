import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import fs from "fs";
import User from "../User/UserMd.js";
import Chat from "./ChatMd.js";
import Message from "../Message/MessageMd.js";
import Media from "../Media/MediaMd.js";
import { __dirname } from "../../app.js";
import { getIo, getSocketIds } from "../../Socket/index.js";
export const getAll = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.userId).populate({
    path: "chatIds",
    options: { sort: { updatedAt: -1 } },
    populate: [
      { path: "lastMessageId" },
      {
        path: "memberPrivateIds",
        select: "username profilePictureId",
        populate: { path: "profilePictureId" },
      },
    ],
  });
  const chats = user.chatIds;
  return res.status(200).json({
    success: true,
    message: "get all chats",
    data: chats,
  });
});

export const getOne = catchAsync(async (req, res, next) => {
  const chatId = req.params.id;
  const features = new ApiFeatures(Chat, req.query, req?.role)
    .addManualFilters({ _id: chatId })
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate([
      {
        path: "memberPrivateIds",
        select: "username profilePictureId",
        populate: { path: "profilePictureId" },
      },
      {
        path: "memberIds",
        select: "username profilePictureId",
        populate: { path: "profilePictureId" },
      },
      {
        path: "profilePictureId",
      },
    ]);
  const result = await features.execute();
  return res.status(200).json(result);
});

export const createGroupOrChannel = catchAsync(async (req, res, next) => {
  const {
    title = "",
    type = null,
    bio = "",
    profilePictureId = null,
  } = req.body;
  if (!["group", "channel"].includes(type)) {
    return next(new HandleERROR("Invalid chat type", 400));
  }
  const newChat = await Chat.create({
    title,
    bio,
    type,
    profilePictureId,
    ownerId: req.userId,
    adminIds: [req.userId],
    memberIds: [req.userId],
  });
  await User.findByIdAndUpdate(req.userId, {
    $push: { chatIds: newChat._id },
  });
  return res.status(201).json({
    success: true,
    message: `${type} created successfully`,
    data: newChat,
  });
});

export const updateGroupChannel = catchAsync(async (req, res, next) => {
  const { title = "", bio = "", profilePictureId = null } = req.body;
  const { id } = req.params;
  const chat = await Chat.findById(id);
  if (
    chat.ownerId.toString() != req.userId.toString() &&
    !chat.adminIds.find((item) => item.toString() == req.userId)
  ) {
    return next(new HandleERROR("you don't have a permission", 401));
  }
  chat.title = title || chat.title;
  
  chat.profilePictureId = profilePictureId || chat.profilePictureId;
  chat.bio = bio || chat.bio;
  const newChat = await chat.save();
  const socketIds = getSocketIds(...chat.memberIds)
  for (let socketId of socketIds) {
    getIo().to(socketId).emit('updatePublicChat', newChat)
  }
  return res.status(200).json({
    message: "chat updated",
    success: true,
    data: newChat,
  });
});
export const addOrRemoveMember = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { type, memberId } = req.body;
  const selectUser = await User.findById(memberId)
    .select("username profilePictureId phoneNumber")
    .populate("profilePictureId");
  if (!type || !memberId) {
    return next(new HandleERROR("member id and type is required", 400));
  }
  const chat = await Chat.findById(id);
  if (
    chat.ownerId.toString() != req.userId.toString() &&
    !chat.adminIds.find((item) => item.toString() == req.userId)
  ) {
    return next(new HandleERROR("you don't have a permission", 401));
  }
  if (chat.type == "private") {
    return next(new HandleERROR("you don't have a permission", 401));
  }
  if (
    chat.memberIds.find((item) => item.toString() == memberId.toString()) &&
    type == "add"
  ) {
    return next(new HandleERROR("member already exist", 400));
  }
  if (type == "add") {
    await Chat.findByIdAndUpdate(id, { $push: { memberIds: memberId } });
    await User.findByIdAndUpdate(memberId, { $push: { chatIds: id } });
  } else {
    await Chat.findByIdAndUpdate(id, { $pull: { memberIds: memberId } });
    await User.findByIdAndUpdate(memberId, { $pull: { chatIds: id } });
  }
  const socketIds = getSocketIds(...chat.memberIds, memberId)
  for (let socketId of socketIds) {
    getIo().to(socketId).emit('addOrRemoveMember', { chatId: id, type, memberId, member: selectUser })
  }

  return res.status(201).json({
    success: true,
    message: `${type} member successfully`,
  });
});

export const addOrRemoveAdmin = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { type, memberId } = req.body;
  if (!type || !memberId) {
    return next(new HandleERROR("member id and type is required", 400));
  }
  const chat = await Chat.findById(id);
  if (chat.ownerId.toString() != req.userId.toString()) {
    return next(new HandleERROR("you don't have a permission", 401));
  }
  if (chat.type == "private") {
    return next(new HandleERROR("you don't have a permission", 401));
  }
  if (!chat.memberIds.find((item) => item.toString() == memberId.toString())) {
    return next(new HandleERROR("member dosent exist in your member", 400));
  }
  if (type == "add") {
    await Chat.findByIdAndUpdate(id, { $push: { adminIds: memberId } });
  } else {
    await Chat.findByIdAndUpdate(id, { $pull: { adminIds: memberId } });
  }
  return res.status(201).json({
    success: true,
    message: `${type} admin successfully`,
  });
});
export const removeChat = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const chat = await Chat.findById(id);
  if (chat.type == "private") {
    if (!chat.memberPrivateIds.find((item) => item.toString() == req.userId)) {
      return next(new HandleERROR("you don't have a permission", 401));
    }
    await Chat.findByIdAndDelete(id);
    for (let memberId of chat.memberPrivateIds) {
      await User.findByIdAndUpdate(memberId, { $pull: { chatIds: id } });
    }
  } else {
    if (chat.ownerId == req.userId) {
      await Chat.findByIdAndDelete(id);
      for (let memberId of chat.memberIds) {
        await User.findByIdAndUpdate(memberId, { $pull: { chatIds: id } });
      }
    } else {
      await Chat.findByIdAndUpdate(id, {
        $pull: { memberIds: req.userId, adminIds: req.userId },
      });
      await User.findByIdAndUpdate(req.userId, { $pull: { chatIds: id } });
      return res.status(200).json({
        message: "left chat",
        success: true,
      });
    }
  }
  const messages = await Message.find({ chatId: id });
  for (let msg of messages) {
    if (msg?.mediaId) {
      const media = await Media.findByIdAndDelete(msg.mediaId);
      if (media && fs.existsSync(`${__dirname}/Public/${media.file.filename}`)) {
        fs.unlinkSync(`${__dirname}/Public/${media.file.filename}`);
      }
    }
  }
  await Message.deleteMany({ chatId: id });
  return res.status(200).json({
    message: "chat removed",
    success: true,
  });
});
