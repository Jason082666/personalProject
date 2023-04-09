import { redisClient } from "../backend/server/models/redis.js";
import { updateNewPopById } from "../backend/server/models/question.js";
redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (error) => {
  console.error("Error connecting to Redis", error);
});

const funct = async () => {
  while (redisClient.status !== "reconnecting") {
    const object = await redisClient.brpop("updatePopToES", 1);
    if (object) {
      try {
        const parseObject = JSON.parse(object[1]);
        for (let id in parseObject) {
          const num = parseObject[id];
          await updateNewPopById(id, num);
        }
      } catch (e) {
        console.error(e);
        return undefined;
      }
    }
  }
};

funct();
