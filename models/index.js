const Shift = require("./shift");
const User = require("./user");

Shift.belongsTo(User, { as: "Marshall", foreignKey: "marshallId" });
Shift.belongsTo(User, { as: "Supervisor", foreignKey: "supervisorId" });

User.hasMany(Shift, { as: "MarshallShifts", foreignKey: "marshallId" });
User.hasMany(Shift, { as: "SupervisorShifts", foreignKey: "supervisorId" });

module.exports = {
  User,
  Shift
};
