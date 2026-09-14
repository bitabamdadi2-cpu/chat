import { catchAsync } from "vanta-api";
import { HandleERROR } from "vanta-api";
import fs from "fs";
import { __dirname } from "../../app.js";
import Media from "./MediaMd.js";
export const uploadCn = catchAsync(async (req, res, next) => {
  const file = req.file;
  const media = await Media.create({
    file,
    userId: req.userId,
    type: req.body.type,
  });
  return res.status(201).json({
    data: media,
    success: true,
    message: "file upload successfully",
  });
});
export const uploadMulti = catchAsync(async (req, res, next) => {
  const files = req.files;
  const data = [];
  for (let file of files) {
    const media = await Media.create({
      file,
      userId: req.userId,
      type:file.type,
    });
    data.push(media)
  }
  return res.status(201).json({
    data,
    success: true,
    message: "file upload successfully",
  });
});
export const deleteFile = catchAsync(async (req, res, next) => {
  const { mediaId=null} = req.body;
  if (!mediaId) {
    return next(new HandleERROR("filename is required", 400));
  }
  const media=await Media.findById(mediaId)
  if(media.userId.toString()!=req.userId.toString()){
        return next(new HandleERROR("you don't have a permission", 401));
  }
  const currentName = media.file.filename
  if (fs.existsSync(`${__dirname}/Public/${currentName}`)) {
    fs.unlinkSync(`${__dirname}/Public/${currentName}`);
  }
  return res.status(200).json({
    success: true,
    message: "file deleted",
  });
});
