const Relationship = require("../models/relationship");
const { User, Shift } = require("../models/index");
const { default: getNextWeekDates } = require("../utils/getDate");
const { Op } = require("sequelize");
const { generateWeeklyScheduleData } = require("../utils/weeklySchedule");

exports.generateWeeklySchedule = async (req, res) => {
  try {
    const shifts = await generateWeeklyScheduleData();
    await Shift.bulkCreate(shifts);
    res
      .status(201)
      .json({
        success: true,
        message: "Weekly shifts generated successfully.",
      });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to generate schedule.", error });
  }
};

exports.getWeeklySchedule = async (req, res) => {
  try {
    const weekDates = getNextWeekDates().map(
      (date) => new Date(date).toISOString().split("T")[0]
    );
    console.log(weekDates);
    console.log("Before Shift.findAll");
    const shifts = await Shift.findAll({
      where: { date: { [Op.in]: weekDates } },
      include: [
        { model: User, as: "Marshall" },
        { model: User, as: "Supervisor" },
      ],
    });
    console.log("After Shift.findAll");
    console.log(shifts);
    res.status(200).json({ success: true, data: shifts });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch weekly schedule.",
        error,
      });
  }
};

exports.getDailySchedule = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    console.log(today);
    const shifts = await Shift.findAll({
      where: { date: today },
      include: [
        { model: User, as: "Marshall" },
        { model: User, as: "Supervisor" },
      ],
    });

    res.status(200).json({ success: true, data: shifts });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch daily schedule.",
        error,
      });
  }
};
