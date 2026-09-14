import { catchAsync, HandleERROR } from "vanta-api";
import User from "../User/UserMd.js";
import { sendAuthCode, verifyCode } from "../../Utils/smsHandler.js";

import jwt from "jsonwebtoken";
export const auth = catchAsync(async (req, res, next) => {
  const { phoneNumber } = req.body;
  let user = await User.findOne({ phoneNumber });
  const resultSms = await sendAuthCode(phoneNumber);
  if (!resultSms.success) {
    return res.status(500).json({
      success: false,
      message: resultSms.message,
    });
  }
  return res.status(200).json({
    success: true,
    message: "Otp Code sent",
    data: {
      userExist: user ? true : false,
    },
  });
});
export const loginWithOtp = catchAsync(async (req, res, next) => {
  const { phoneNumber = null, code = null, username = null } = req.body;
  let user = await User.findOne({ phoneNumber })
  if (!user && !username) {
    return next(
      new HandleERROR(
        "user not found, please provide a username to create account",
        404,
      ),
    );
  }
  if (!phoneNumber && !code) {
    return next(
      new HandleERROR(
        "phone and code is required",
        400,
      ),
    );
  }
  const resultVerify = await verifyCode(phoneNumber, code);
  if (!resultVerify.success) {
    return next(new HandleERROR("invalid code", 401));
  }
  if (!user) {
    user = await User.create({ phoneNumber, username });
  }
  const token = jwt.sign(
    { _id: user._id },
    process.env.JWT_SECRET,
  );
  return res.status(200).json({
    success: true,
    message: "login successfully",
    data: {
      token,
      user,
    },
  });
});
export const resendCode = catchAsync(async (req, res, next) => {
  const { phoneNumber } = req.body;
  const resultSms = await sendAuthCode(phoneNumber);
  if (!resultSms.success) {
    return res.status(500).json({
      success: false,
      message: resultSms.message || "sms sending failed",
    });
  }
  return res.status(200).json({
    success: true,
    message: "Otp Code sent",
  });
});