const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const Attendance = sequelize.define(
    "attendances",
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
          },

        status: {
            type: DataTypes.ENUM,
            values: ['On-duty', 'Absent', "On-leave", "Off-duty"],
            allowNull: false,
            validate: {
              isIn: {
                args: [['Admin', 'Supervisor', "Marshall"]],
                msg: "Role must be either 'Admin', 'Supervisor' or 'Marshall'"
              }
            }
          },
          reason: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          startDate: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          endDate: {
            type: DataTypes.DATE,
            allowNull: true,
          },
    },{
        timestamps: false 
      }
);

module.exports = Attendance;