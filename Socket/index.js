import { Server } from "socket.io";

// توجه: این فایل دیگر app.js را import نمی‌کند. قبلاً اینجا هم app.js را
// import می‌کرد و هم توسط ChatCn.js/MessageCn.js (که خودشان از طریق روترها
// در app.js لود می‌شوند) import می‌شد؛ یعنی یک وابستگی حلقه‌ای
// (app.js -> Chat/Message router -> Socket/index.js -> app.js) که باعث خطای
// "Cannot access 'app' before initialization" می‌شد. حالا ساخت سرور HTTP در
// server.js انجام می‌شود و فقط httpServer از طریق initSocket به اینجا داده
// می‌شود، بدون هیچ وابستگی برگشتی به app.js.

let io = null;
const onlineUsers = {};

export function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId && userId !== "undefined") {
      onlineUsers[userId] = socket.id;
    }
    io.emit("getOnlineUser", Object.keys(onlineUsers));
    socket.on("disconnect", () => {
      delete onlineUsers[userId];
      io.emit("getOnlineUser", Object.keys(onlineUsers));
    });
  });

  return io;
}

// چون ChatCn.js/MessageCn.js در زمان import شدن (قبل از اجرای initSocket)
// بارگذاری می‌شوند، نباید مقدار io را مستقیم export کنند (در آن لحظه هنوز null
// است) — به‌جایش هر بار موقع نیاز با getIo() خوانده می‌شود؛ در عمل هم io فقط
// وقتی استفاده می‌شود که یک درخواست HTTP واقعی در جریان است، یعنی حتماً بعد از
// اجرای initSocket در server.js.
export function getIo() {
  return io;
}

export function getSocketIds(...userIds) {
  const socketIds = [];
  for (let userId of userIds) {
    if (onlineUsers[userId]) {
      socketIds.push(onlineUsers[userId]);
    }
  }
  return socketIds;
}
