// const redisInstance = require("../db/redis");
// let ACL = require("acl2");
// const acl = (name) => {
//Using acl2 redis instance
// var client = require("redis").createClient(6379, "127.0.0.1", {
//   no_ready_check: true,
// });
// client.connect();
// client.set("name", `${name}`);
// const ACL = require("acl2");
// const acl_client = new ACL(
//   new ACL.redisBackend({ client: client, prefix: "my_acl_prefix_" })
// );
//Using pre-connected instance
// const redisClient = redisInstance.getRedisClient();
// console.log(redisClient);
// const acl = new ACL(
//   new ACL.redisBackend({ client: redisClient, prefix: "acl_" })
// );
// acl_client.allow("sub-admin", "showSubUsers", "view");
// const userName = name;
// acl_client.addUserRoles(`${userName}`, "sub-admin");
// acl_client.allowedPermissions(
//   `${userName}`,
//   ["showSubUsers"],
//   function (err, permissions) {
//     console.log(permissions);
//   }
// );
// };

// module.exports = acl;
