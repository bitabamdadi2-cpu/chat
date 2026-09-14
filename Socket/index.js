import { createServer } from "http";
import { Server } from "socket.io";
import app from "../app.js";
const server = createServer(app);
const io = new Server(server, { cors: "*" });
const onlineUsers = {};
const getSocketIds = (...userIds) => {
  const socketIds = [];
  for (let userId of userIds) {
    if (onlineUsers[userId]) {
      socketIds.push(onlineUsers[userId]);
    }
  }
  return socketIds;
};
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId != "undefined") {
    onlineUsers[userId] = socket.id;
  }
  io.emit("getOnlineUser", Object.keys(onlineUsers));
  socket.on("disconnect", () => {
    delete onlineUsers[userId];
    io.emit("getOnlineUser", Object.keys(onlineUsers));
  });
});

export { io, server, getSocketIds };
