import { Router } from "express";
import { getOne, update, remove, search } from "./UserCn.js";
const userRouter = Router();
userRouter.route("/search").get(search);
userRouter.route("/").get(getOne).patch(update).delete(remove);
export default userRouter;
