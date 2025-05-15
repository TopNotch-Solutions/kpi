const {Router} = require("express");
const shiftRouter = Router();
const shiftController = require("../controllers/shiftController");

shiftRouter.post("/generate-weekly", shiftController.generateWeeklySchedule);
shiftRouter.get("/weekly", shiftController.getWeeklySchedule);
shiftRouter.get("/daily", shiftController.getDailySchedule);

module.exports = shiftRouter;