import { Server } from "socket.io";
import { terminateRoom, leaveRoom } from "./server/models/game.js";
import { gameHostValidation } from "./server/models/user.js";

export const socketio = async function (server) {
  const io = new Server(server);
  io.on("connection", (socket) => {
    console.log("A user connected");
    socket.on("join", async (object) => {
      const { userId, userName, roomId } = object;
      const validationUser = await gameHostValidation(userId, userName, roomId);
      socket.join(roomId);
      socket.roomId = roomId;
      if (validationUser) {
        socket.emit("showControllerInterface", { userName, userId, roomId });
        socket.hostId = userId;
        io.host = {};
        io.host[roomId] = { userId, userName, roomId };
        socket.emit("welcomeMessage");
      } else {
        socket.emit("message", `Welcome to the game room, ${userName} !`);
        socket.userId = userId;
        const user = { userId, userName };
        if (!io.users) {
          io.users = {};
        }
        if (!io.users[roomId]) io.users[roomId] = [];
        io.users[roomId].push(user);
        io.to(roomId).emit("userJoined", [io.host[roomId], io.users[roomId]]);
      }
    });
    socket.on("disconnect", async () => {
      console.log("A user disconnected");
      const roomId = socket.roomId;
      if (socket.hostId) {
        delete io.host[roomId];
        await leaveRoom(roomId, socket.hostId, true);
        if (!io.users) return;
        if (!io.users[roomId][0] && !io.host[roomId]) {
          // terminate the room!(也不用存資料)
          await terminateRoom(roomId);
          delete io.users[roomId];
        }
        return;
      }
      if (io.users && io.users[roomId]) {
        io.users[roomId] = io.users[roomId].filter(
          (user) => user.userId !== socket.userId
        );
        await leaveRoom(roomId, socket.userId);
        io.to(roomId).emit("userLeft", io.users[roomId]);
      }
      if (!io.users) return;

      if (!io.users[roomId][0] && !io.host[roomId]) {
        // terminate the room!(也不用存資料)
        await terminateRoom(roomId);
        delete io.users[roomId];
      }
    });
    socket.on("startGame", () => {
      const roomId = socket.roomId;
      io.to(roomId).emit("loadFirstQuizz");
    });
  });
};
