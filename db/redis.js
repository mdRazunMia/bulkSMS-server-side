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
      if (client) {
        return resolve(client);
      }
    });
  }

  function getRedisClient() {
    // console.log(client);
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
