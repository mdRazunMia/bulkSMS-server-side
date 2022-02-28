const redis = require("redis");

module.exports = (function () {
  let client;
  function redisConnectAndGetTheInstance() {
    return new Promise(function (resolve, reject) {
      if (client) {
        console.log("Using already created redis db connection instance");
        return resolve(client);
      }
      client = redis.createClient({
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_HOST,
      });

      client.connect();
      // //   console.log(client);
      // client.on("connect", () => {
      //   console.log("success");
      // });
      if (client) {
        return resolve(client);
      }
    });
  }

  function getRedisClient() {
    console.log(client);
    if (!client) {
      throw new Error("RedisDb object is not initialized!");
    }
    return client;
  }

  return {
    getRedisClient,
    redisConnectAndGetTheInstance,
  };
})();

// --------------------------------------------------------

// const client = redis.createClient({
//   port: process.env.REDIS_PORT,
//   host: `${process.env.REDIS_HOST}`,
// });

// client.connect();
// // console.log(client);
// client.on("connect", () => {
//   console.log("Successfully connected to redis database.");
// });

// client.on("ready", () => {
//   console.log("Client connected to redis database and ready to use...");
// });

// client.on("error", (error) => {
//   console.log(error.message);
// });

// client.on("end", () => {
//   console.log("Client disconnected from redis.");
// });

// process.on("SIGINT", () => {
//   client.quit();
// });
// //
// module.exports = client;
