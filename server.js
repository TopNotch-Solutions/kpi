const express = require("express");
const bodyParser = require("body-parser");
const sequelize = require("./config/dbConfig");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(
  cors({
   // origin: ["http://localhost:3000", "http://localhost:3001", "https://dt.mtc.com.na:4000"],
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    credentials: true,
    exposedHeaders: ["Authorization", "x-access-token", "data-access-token"],
  })
);
const authRouter = require("./routes/authRoute");

app.use("/auth", authRouter);

// app.use("*", (req, res) => {
//     res.status(404).json({
//       status: "FAILURE",
//       message: "Route not found",
//     });
//   });
  
sequelize
  .sync()
  .then(() => {
    console.log("Database connected");
  })
  .catch((error) => {
    console.error("Error synchronizing database:", error);
  });

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});