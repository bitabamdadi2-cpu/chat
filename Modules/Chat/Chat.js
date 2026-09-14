import { Router } from "express";
import {
  addOrRemoveAdmin,
  addOrRemoveMember,
  createGroupOrChannel,
  getAll,
  getOne,
  removeChat,
  updateGroupChannel,
} from "./ChatCn.js";
const chatRouter = Router();
chatRouter.route("/").get(getAll).post(createGroupOrChannel);
chatRouter.route("/admin/:id").patch(addOrRemoveAdmin);
chatRouter.route("/member/:id").patch(addOrRemoveMember);
chatRouter
  .route("/:id")
  .get(getOne)
  .patch(updateGroupChannel)
  .delete(removeChat);
export default chatRouter;
