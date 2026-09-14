import { Router } from "express";
import upload from "../../Utils/uploadFile.js";
import { deleteFile, uploadCn, uploadMulti } from "./MediaCn.js";
const uploadRouter=Router()
uploadRouter.route('/').post(upload.single('file'),uploadCn).delete(deleteFile)
uploadRouter.route('/multi').post(upload.array('files',5),uploadMulti)
export default uploadRouter