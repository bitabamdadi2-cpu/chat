import { Router } from "express";
import { getOne, update, remove } from "./UserCn.js";
const userRouter = Router();
userRouter.route("/").get(getOne).patch(update).delete(remove);
export default userRouter;
