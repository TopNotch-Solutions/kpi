const Sequelize = require('sequelize');

const sequelize = new Sequelize({
    host: "localhost",
    username: "root",
    password: "",
    database: "kpi",
    dialect: "mysql",
    //port:"3307"
})



module.exports = sequelize;