const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const User = sequelize.define("user", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  phoneNumber: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: true },
  password: { type: DataTypes.STRING, allowNull: true },
  device: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
  role: {
    type: DataTypes.ENUM,
    values: ['Admin','Marshall'],
    allowNull: false,
    validate: {
      isIn: {
        args: [['Admin', 'Marshall']],
        msg: "Role must be either 'Admin' or 'Marshall'"
      }
    }
  },
  createdAt: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW }
}, {
  timestamps: false
});

module.exports = User;
