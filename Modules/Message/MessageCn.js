import ApiFeatures, { catchAsync, HandleERROR } from "vanta-api";
import User from "../User/UserMd.js";
import Message from "./MessageMd.js";
import Media from "../Media/MediaMd.js";
import Chat from "../Chat/ChatMd.js";
export const getAllMessagesOfChat = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(req.userId);
  if (!user.chatIds.find((item) => item.toString() == id.toString())) {
    return next(new HandleERROR("you don't have a permission", 401));
  }
  const features = new ApiFeatures(Message, req.query, req?.role)
    .addManualFilters({ chatId: id })
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .populate([
      {
        path: "userId",
        select: "username profilePictureId",
        populate: { path: "profilePictureId" },
      },
      {
        path: "replyToMessageId",
      },
      {
        path: "mediaId",
      },
    ]);
  const result = await features.execute();
  return res.status(200).json(result);
});

export const removeMessage = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const message = await Message.findById(id);
  if (message.userId.toString() != req.userId.toString()) {
    return next(new HandleERROR("you don't have a permission", 401));
  }
  await Message.findByIdAndDelete(id);
  const media = await Media.findByIdAndDelete(message.mediaId);

  if (fs.existsSync(`${__dirname}/Public/${media.file.filename}`)) {
    fs.unlinkSync(`${__dirname}/Public/${media.file.filename}`);
  }
  return res.status(200).json({
    success: true,
    message: "msg removed",
  });
});
export const update = catchAsync(async (req, res, next) => {
  const { chatId = null, userId = null, ...otherData } = req.body;
  const { id } = req.params;
  const message = await Message.findById(id);
  if (req.userId.toString() != message.userId.toString()) {
    return next(new HandleERROR("you can not update this message", 401));
  }
  const newMessage = await Message.findByIdAndUpdate(id, otherData, {
    runValidator: true,
    new: true,
  });
  return res.status(200).json({
    success: true,
    message: "msg updated",
    data: newMessage,
  });
});

export const sendMessage = catchAsync(async (req, res, next) => {
  const { chatId } = req.body;
  const userId = req.userId;
  const chat = await Chat.findById(chatId);
  if (
    (chat.type == "private" &&
      !chat.memberPrivateIds.find(
        (item) => item.toString() == userId.toString(),
      )) ||
    (chat.type == "group" &&
      !chat.memberIds.find((item) => item.toString() == userId.toString())) ||
    (chat.type == "channel" &&
      !chat.adminIds.find((item) => item.toString() == userId.toString()) &&
      chat.ownerId.toString() != userId.toString())
  ) {
    return next(
      new HandleERROR(
        "you do not have permission to send message in this chat",
        401,
      ),
    );
  }
  const message = await Message.create({ ...req.body, userId });
  chat.lastMessageId = message._id;
  await chat.save();
  return res.status(200).json({
    success: true,
    message: "msg send successfully",
    data: message,
  });
});
export const sendAndCreatePrivate = catchAsync(async (req, res, next) => {
  const { receiverId, ...otherData } = req.body;
  const { userId } = req;
  const chat = await Chat.findOne({
    $and: [
      { type: "private" },
      { memberPrivateIds: receiverId },
      { memberPrivateIds: userId },
    ],
  });
  if (chat) {
    return next(new HandleERROR("chat already exist", 400));
  }
  const newChat = await Chat.create({
    type: "private",
    memberPrivateIds: [receiverId, userId],
  });
  const message = await Message.create({
    ...otherData,
    userId,
    chatId: newChat._id,
  });
  newChat.lastMessageId = message._id;
  await newChat.save();
  return res.status(201).json({
    success: true,
    message: "Private chat created and message sent successfully",
    data: message,
  });
});
