let grantList = [
  {
    role: "admin",
    resource: "showSubUsers",
    action: "create:any",
    attributes: "*, !views",
  },
  {
    role: "admin",
    resource: "showSubUsers",
    action: "read:any",
    attributes: "*",
  },
  {
    role: "admin",
    resource: "showSubUsers",
    action: "update:any",
    attributes: "*, !views",
  },
  {
    role: "admin",
    resource: "showSubUsers",
    action: "delete:any",
    attributes: "*",
  },

  {
    role: "user",
    resource: "video",
    action: "create:own",
    attributes: "*, !rating, !views",
  },
  { role: "user", resource: "video", action: "read:any", attributes: "*" },
  {
    role: "user",
    resource: "video",
    action: "update:own",
    attributes: "*, !rating, !views",
  },
  { role: "user", resource: "video", action: "delete:own", attributes: "*" },
];

module.exports = grantList;
