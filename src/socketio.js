import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import {
  terminateRoom,
  leaveRoom,
  startRoom,
  getCurrentQuizzFromMongo,
  getCurrentQuizzFromRedis,
  playerDisconnect,
  findHostAndUsers,
} from "./server/models/game.js";
import { redisClient } from "./server/models/redis.js";
import { gameHostValidation } from "./server/models/user.js";
import { showRank, addToQuequeAndUpdateMongo } from "./server/models/score.js";
import {
  addGameHistory,
  addGameHistoryToHost,
} from "./server/models/historydata.js";
import { deleteKey } from "./server/models/redis.js";

export const socketio = async function (server) {
  const io = new Server(server);
  const pubClient = redisClient;
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));
  io.on("connection", (socket) => {
    console.log("A user connected");
    socket.on("join", async (object) => {
      const { userId, userName, roomId, gameName } = object;
      socket.join(roomId);
      socket.gameName = gameName;
      const validationUser = await gameHostValidation(userId, userName, roomId);
      socket.roomId = roomId;
      pubClient.pubsub("channels", (err, channels) => {
        console.log("all channels", channels);
        if (!channels.includes(roomId)) {
          console.log("subscribe");
          subClient.subscribe(roomId);
        }
      });
      socket.roomId = roomId;
      if (validationUser) {
        socket.emit("showControllerInterface", { userName, userId, roomId });
        socket.hostId = userId;
        // if (!io.host) io.host = {};
        // io.host[roomId] = { userId, userName, roomId };
        // if (!io.users) io.users = {};
        // io.users[roomId] = [];
        if (!io.score) io.score = {};
        io.score[roomId] = [];
        if (!io.data) io.data = {};
        io.data[roomId] = [];
        if (!io.quizNum) io.quizNum = {};
        io.quizNum[roomId] = 1;
        if (!io.quizLength) io.quizLength = {};
        io.quizLength[roomId] = "";
        socket.emit("welcomeMessage");
      } else {
        const welcomeString = `Welcome to the game room, ${userName} !`;
        socket.emit("message", {
          welcomeString,
          gameName: socket.gameName,
        });
        socket.userId = userId;
        socket.userName = userName;
        // const user = { userId, userName };
        // io.users[roomId].push(user);
        const dataArray = await findHostAndUsers(roomId);
        const hostData = JSON.parse(dataArray[0].userName);
        const hostKey = Object.keys(hostData)[0];
        const hostPackage = {
          userId: hostKey,
          userName: hostData[hostKey],
          roomId,
        };
        const userPackage = dataArray.slice(2);
        const message = JSON.stringify({
          event: "userJoined",
          data: [hostPackage, userPackage],
        });
        console.log("emit message", message);
        await pubClient.publish(roomId, message);
      }
    });

    subClient.on("message", (roomId, message) => {
      console.log("message", message);
      const dataObject = JSON.parse(message);
      if (dataObject.event === "userJoined") {
        console.log("catch userJoined");
        const host = dataObject.data[0];
        const users = dataObject.data[1];
        io.to(roomId).emit("userJoined", [host, users]);
      }
    });

    socket.on("disconnect", async () => {
      console.log("A user disconnected");
      const roomId = socket.roomId;
      if (socket.hostId) {
        await deleteKey(`${roomId}-room`);
        await deleteKey(`${roomId} -score`);
        await deleteKey(`${roomId}`);
        await deleteKey(`${roomId}-disconnect`);
        await terminateRoom(roomId);
        // delete io.host[roomId];
        // delete io.users[roomId];
        delete io.score[roomId];
        delete io.data[roomId];
        delete io.quizNum[roomId];
        delete io.quizLength[roomId];
        const message = JSON.stringify({
          event: "hostLeave",
        });
        await pubClient.publish(roomId, message);
        return;
      }
      // if (io.users && io.users[roomId]) {
      //   io.users[roomId] = io.users[roomId].filter(
      //     (user) => user.userId !== socket.userId
      //   );
      //   if (!io.users[roomId]) {
      //     io.users[roomId] = [];
      //   }
      await leaveRoom(roomId, socket.userId);
      await playerDisconnect(roomId, socket.userId, socket.userName);
      const dataArray = await findHostAndUsers(roomId);
      socket.leave(roomId);
      const userPackage = dataArray.slice(2);
      const message = JSON.stringify({
        event: "userLeft",
        data: userPackage,
      });
      await pubClient.publish(roomId, message);
    });
    subClient.on("message", (roomId, message) => {
      const dataObject = JSON.parse(message);
      if (dataObject.event === "hostLeave") {
        console.log("hostLeave");
        io.to(roomId).emit("hostLeave");
      }
    });
    subClient.on("message", (roomId, message) => {
      const dataObject = JSON.parse(message);
      if (dataObject.event === "userLeft") {
        console.log("catch left");
        const { roomId } = socket;
        io.to(roomId).emit("userLeft", dataObject.data);
      }
    });
    // }
    subClient.on("message", (roomId, message) => {
      const dataObject = JSON.parse(message);
      if (dataObject.event === "userLeft") {
        console.log("catch left");
        const { roomId } = socket;
        io.to(roomId).emit("userLeft", dataObject.data);
      }
    });
    socket.on("startGame", async () => {
      const { roomId, hostId } = socket;
      const { firstQuizz, length } = await startRoom(roomId, hostId);
      if (!firstQuizz || !length) return;
      io.quizLength[roomId] = length;
      firstQuizz.num = 1;
      const rankResult = await showRank(roomId, Infinity);
      const message = JSON.stringify({
        event: "loadFirstQuizz",
        data: { firstQuizz, length, rankResult },
      });
      await pubClient.publish(roomId, message);
      // io.to(roomId).emit("loadFirstQuizz", { firstQuizz, length, rankResult });
    });
    subClient.on("message", (roomId, message) => {
      const dataObject = JSON.parse(message);
      if (dataObject.event === "loadFirstQuizz") {
        const { roomId } = socket;
        io.to(roomId).emit("loadFirstQuizz", dataObject.data);
      }
    });
    socket.on("nextQuiz", async (quizNum) => {
      const { roomId } = socket;
      io.quizNum[roomId] += 1;
      const rankResult = await showRank(roomId, Infinity);
      const quiz = await getCurrentQuizzFromRedis(roomId, quizNum);
      if (quiz) {
        const message = {
          quiz,
          quizNum,
          quizLength: io.quizLength[roomId],
          rankResult,
        };
        pubClient.publish(roomId, message);
        io.to(roomId).emit("showQuiz", {
          quiz,
          quizNum,
          quizLength: io.quizLength[roomId],
          rankResult,
        });
      } else {
        const quiz = await getCurrentQuizzFromMongo(roomId, quizNum);
        const message = {
          quiz,
          quizNum,
          quizLength: io.quizLength[roomId],
          rankResult,
        };
        pubClient.publish(roomId, message);
      }
    });
    subClient.on("message", (roomId, message) => {
      const dataObject = JSON.parse(message);
      if (dataObject.event === "showQuiz") {
        const { roomId } = socket;
        io.to(roomId).emit("showQuiz", dataObject.data);
      }
    });
    socket.on("getAnswer", async ({ chooseOption, initvalue, score }) => {
      const { roomId, userId } = socket;
      const message = JSON.stringify({
        event: "saveOptions",
        data: chooseOption,
        userId,
      });
      const dataMessage = JSON.stringify({
        event: "updateRankAndScore",
        data: { initvalue, score, userId },
      });
      await pubClient.publish(roomId, dataMessage);
      await pubClient.publish(roomId, message);

      // const index = io.quizNum[roomId] - 1;
      // if (!io.score[roomId][index]) io.score[roomId][index] = {};
      // if (!io.data[roomId][index]) io.data[roomId][index] = {};
      // 最後用來留紀錄給mongo db 的，用來存歷史資料
      // io.score[roomId][index][userId] = chooseOption;
      // chooseOption.forEach((option) => {
      //   if (!io.data[roomId][index][option]) {
      //     io.data[roomId][index][option] = 1;
      //   } else {
      //     io.data[roomId][index][option] += 1;
      //   }
      // });
      // io.to(roomId).emit("updateRankAndScore", { initvalue, score, userId });
    });

    subClient.on("message", (roomId, message) => {
      const dataObject = JSON.parse(message);
      if (dataObject.event === "saveOptions") {
        if (socket.hostId) {
          const index = io.quizNum[roomId] - 1;
          if (!io.score[roomId][index]) io.score[roomId][index] = {};
          if (!io.data[roomId][index]) io.data[roomId][index] = {};
          // 最後用來留紀錄給mongo db 的，用來存歷史資料
          const dataArray = dataObject.data;
          io.score[roomId][index][dataObject.userId] = dataArray;
          dataArray.forEach((option) => {
            if (!io.data[roomId][index][option]) {
              io.data[roomId][index][option] = 1;
            } else {
              io.data[roomId][index][option] += 1;
            }
          });
        }
      }
    });
    subClient.on("message", (roomId, message) => {
      const dataObject = JSON.parse(message);
      if (dataObject.event === "updateRankAndScore") {
        // io.to(roomId).emit("updateRankAndScore", {
        //   initvalue,
        //   score,
        //   userId,
        // });
        io.to(roomId).emit("updateRankAndScore", dataObject.data);
      }
    });

    // 只有host會接到timeout
    socket.on("timeout", async () => {
      const { roomId } = socket;
      const index = io.quizNum[roomId] - 1;
      const scoreObj = io.data[roomId][index];
      io.to(roomId).emit("showQuizExplain", scoreObj);
    });
    socket.on("earlyTimeout", async () => {
      const { roomId } = socket;
      const index = io.quizNum[roomId] - 1;
      const scoreObj = io.data[roomId][index];
      io.to(roomId).emit("clearCountdown");
      io.to(roomId).emit("showQuizExplain", scoreObj);
    });
    socket.on("showFinal", async () => {
      const { roomId } = socket;
      const rankResult = await showRank(roomId, 5);
      const gameRoom = await addGameHistory(roomId, io.score[roomId]);
      await redisClient.del(`${roomId}-room`);
      await addGameHistoryToHost(
        gameRoom.founder.id,
        gameRoom._id,
        gameRoom.name,
        gameRoom.date
      );
      await addToQuequeAndUpdateMongo(roomId);
      io.to(roomId).emit("showFinalScore", rankResult);
    });
  });
};
