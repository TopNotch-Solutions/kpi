const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const ScheduleMeta = sequelize.define("ScheduleMeta", {
  weekIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  }
});

module.exports = ScheduleMeta;