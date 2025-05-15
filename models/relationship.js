const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const Relationship = sequelize.define(
    "relationships",
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
          },

        supervisorId: {
            type: DataTypes.BIGINT,
            allowNull: false
          },
          marshallId: {
            type: DataTypes.BIGINT,
            allowNull: false
          }
    },{
        timestamps: false 
      }
);

module.exports = Relationship;