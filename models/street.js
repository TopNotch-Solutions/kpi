const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConfig");

const Street = sequelize.define(
    "streets",
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
          },

        streetCode: {
            type: DataTypes.STRING,
            allowNull: false
          },
           priority: {
            type: DataTypes.ENUM,
            values: ['1', '2', "3"],
            allowNull: false,
            validate: {
              isIn: {
                args: [['1', '2', "3"]],
                msg: "priority must be either '1', '2' or '3'"
              }
            }
          },
           status: {
            type: DataTypes.ENUM,
             values: ['Active', 'Inactive', "Under Maintainance"],
            allowNull: false,
            validate: {
              isIn: {
                args: [['Active', 'Inactive', "Under Maintainance"]],
                msg: "status must be either 'Active', 'Inactive' or 'Under Maintainance'"
              }
            }
          }
    },{
        timestamps: false 
      }
);

module.exports = Street;