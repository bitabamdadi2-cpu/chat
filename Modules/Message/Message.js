import { Router } from "express";
import {
  getAllMessagesOfChat,
  removeMessage,
  sendAndCreatePrivate,
  sendMessage,
  update,
} from "./MessageCn.js";
const messageRouter = Router();
messageRouter.route("/").post(sendMessage);
messageRouter.route("/new-private").post(sendAndCreatePrivate);
messageRouter
  .route("/:id")
  .get(getAllMessagesOfChat)
  .delete(removeMessage)
  .patch(update);
export default messageRouter;
