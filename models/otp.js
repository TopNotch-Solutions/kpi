const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const OTP = sequelize.define(
    "otp",
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
          },

        userId: {
            type: DataTypes.STRING,
            allowNull: false
          },
          otp: {
            type: DataTypes.STRING,
            allowNull: false
          },
          role: {
            type: DataTypes.STRING,
            allowNull: false
          },
          email: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          expiresAt: {
            type: DataTypes.DATE, 
            allowNull: true,
          }
    },{
        timestamps: false 
      }
);

module.exports = OTP;