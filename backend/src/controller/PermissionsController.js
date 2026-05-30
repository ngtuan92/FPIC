const Role = require("../models/Role");
exports.getUserPermissions = async (roleName) => {
  const role = await Role.findOne({ name: roleName });
  return role ? role.permissions : [];
};
