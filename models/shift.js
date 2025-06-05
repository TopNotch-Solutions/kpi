const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const Shift = sequelize.define("shifts", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
  marshallId: { type: DataTypes.BIGINT, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  shiftType: { type: DataTypes.ENUM('Morning', 'Afternoon'), allowNull: false },
  streetCode: { type: DataTypes.STRING, allowNull: true }
}, {
  timestamps: false
});

module.exports = Shift;