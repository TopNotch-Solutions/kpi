const { User, Shift } = require("../models/index");
const getNextWeekDates  = require("../utils/getDate");
const { Op, where } = require("sequelize");
const { generateWeeklyScheduleData } = require("../utils/weeklySchedule");
const Street = require("../models/street");

exports.generateWeeklySchedule = async (req, res) => {
  try {
    const existingStreet = await Street.count();
    if(existingStreet === 0){
      return res
      .status(500)
      .json({ success: false, message: "There are no streets to allocate marshalls." });
    }
    const existingMarshall = await User.count({where: {role: "Marshall"}});
     if(existingMarshall === 0){
      return res
      .status(500)
      .json({ success: false, message: "There are no marshalls to allocate supervisors and streets to." });
    }
    const weekDates = getNextWeekDates().map(
      (date) => new Date(date).toISOString().split("T")[0]
    );

    const existingShifts = await Shift.count({
      where: { date: { [Op.in]: weekDates } },
    });

    if (existingShifts > 0) {
      return res.status(500).json({
        success: false,
        message: "Schedule for the upcoming week already exists.",
      });
    }
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
    console.log("Before Shift.findAll: ");
    const shifts = await Shift.findAll({
      where: { date: { [Op.in]: weekDates } },
      include: [
        { model: User, as: "Marshall" },
        { model: User, as: "Supervisor" },
      ],
    });
     const mappedData = shifts.map((shift) => ({
      id: shift.id,
      "Marshall First Name": shift.Marshall?.firstName || null,
      "Marshall Last Name": shift.Marshall?.lastName || null,
     "Marshall Phone Number": shift.Marshall?.phoneNumber || null,
      "Marshall Email": shift.Marshall?.email || null,
      Date: shift.date,
      "Shift Type": shift.shiftType,
      "Street Code": shift.streetCode,
      "Supervisor First Name": shift.Supervisor?.firstName || null,
      "Supervisor Last Name": shift.Supervisor?.lastName || null,
      "Supervisor Phone Number": shift.Supervisor?.phoneNumber || null,
    }));

    res.status(200).json({ success: true, data: mappedData });
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

exports.daily = async (req, res) => {
  try {
    const weekDates = getNextWeekDates();

    const shifts = await Shift.findAll({
      where: {
        date: weekDates,
      },
      include: [
        {
          model: User,
          as: "Marshall",
          attributes: ["id", "firstName", "lastName"]
        },
        {
          model: User,
          as: "Supervisor",
          attributes: ["id", "firstName", "lastName"]
        }
      ],
      raw: true,
    });

    // Group shifts by day and compute counts
    const scheduleByDay = weekDates.map(date => {
      const dayShifts = shifts.filter(shift => shift.date === date);

      const uniqueMorning = new Set();
      const uniqueAfternoon = new Set();

      const detailedShifts = dayShifts.map(shift => {
        if (shift.shiftType === "Morning") {
          uniqueMorning.add(shift["Marshall.id"]);
        } else if (shift.shiftType === "Afternoon") {
          uniqueAfternoon.add(shift["Marshall.id"]);
        }

        return {
          marshall: {
            id: shift["Marshall.id"],
            name: `${shift["Marshall.firstName"]} ${shift["Marshall.lastName"]}`
          },
          supervisor: {
            id: shift["Supervisor.id"],
            name: `${shift["Supervisor.firstName"]} ${shift["Supervisor.lastName"]}`
          },
          shiftType: shift.shiftType,
          streetCode: shift.streetCode
        };
      });

      return {
        date,
        shifts: detailedShifts,
        totalMarshallCount: {
          morning: uniqueMorning.size,
          afternoon: uniqueAfternoon.size
        }
      };
    });

    res.status(200).json({
      success: true,
      schedule: scheduleByDay
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve weekly schedule.", error });
  }
};