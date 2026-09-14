import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { catchError } from "vanta-api";
import { exportValidationData } from "./Middlewares/ExportValidation.js";
import userRouter from "./Modules/User/User.js";
import authRouter from "./Modules/Auth/Auth.js";
import rateLimit from "express-rate-limit";
import { swaggerSpec } from "./Utils/Swagger.js";
import swaggerUi from "swagger-ui-express";
import isLogin from "./Middlewares/isLogin.js";
import chatRouter from "./Modules/Chat/Chat.js";
import messageRouter from "./Modules/Message/Message.js";
import uploadRouter from "./Modules/Media/Media.js";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
const app = express();
const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());
app.use(limiter);
app.use("/api/auth", authRouter);
// uploaded media (avatars, message attachments) must stay publicly reachable
// by URL (e.g. <img src>) without an Authorization header, so it is served
// before the auth-gating middlewares below.
app.use("/upload", express.static(`${__dirname}/Public`));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(exportValidationData);
app.use(isLogin);
app.use("/api/users", userRouter);
app.use("/api/chats", chatRouter);
app.use("/api/media", uploadRouter);
app.use("/api/messages", messageRouter);
app.use((req, res, next) => {
  return res.status(404).json({
    message: "Route Not found",
    success: false,
  });
});
app.use(catchError);
export default app;
