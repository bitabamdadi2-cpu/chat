import { createServer } from "http";
import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";
import { initSocket } from "./Socket/index.js";

dotenv.config();
const port = process.env.PORT || 5001;

// httpServer اینجا ساخته می‌شود (نه داخل Socket/index.js) تا هیچ وابستگی
// حلقه‌ای بین app.js و Socket/index.js وجود نداشته باشد.
const httpServer = createServer(app);
initSocket(httpServer);

mongoose.connect(process.env.DATA_BASE).then(() => {
  console.log("DATA BASE IS CONNECT");
});

httpServer.listen(port, () => {
  console.log(`server is running ${port}`);
});
