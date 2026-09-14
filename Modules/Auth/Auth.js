import { Router } from "express";
const authRouter = Router();
import { auth, loginWithOtp,resendCode } from "./AuthCn.js";
authRouter.route("/").post(auth);
authRouter.route("/login").post(loginWithOtp);
authRouter.route("/resend-code").post(resendCode);
export default authRouter;