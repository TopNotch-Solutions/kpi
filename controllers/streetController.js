const { where, Op } = require("sequelize");
const Street = require("../models/street");
const { Shift } = require("../models");
const { generateWeeklyScheduleData } = require("../utils/weeklySchedule");
const { default: getNextWeekDates } = require("../utils/getDate");

exports.create = async (req, res) => {
  const { streetCode, priority, status } = req.body;

  if (!streetCode) {
    return res.status(400).json({ success: false, message: "Street code is required" });
  }
  if (!priority) {
    return res.status(400).json({ success: false, message: "priority is required" });
  }
  if (!status) {
    return res.status(400).json({ success: false, message: "status is required" });
  }

  try {
    const existingStreet = await Street.findOne({
        where: {streetCode}
    });
    
    if(existingStreet){
         return res.status(400).json({ success: false, message: "Street code already in use"});
    }
    await Street.create({ streetCode, priority,status });
    if(status === "Active"){
      const today = new Date().toISOString().split("T")[0];
      await Shift.destroy({
        where: {
          date: {
            [Op.gte]: today,
          },
        },
      });
      const shifts = await generateWeeklyScheduleData();
      await Shift.bulkCreate(shifts);
    }
    return res.status(201).json({ success: true, message: "Street created successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error });
  }
};

exports.allStreet = async (req, res) => {
  try {
    const streets = await Street.findAll({ order: [["id", "ASC"]] });
    const count = await Street.count();
    return res.status(200).json({ success: true,total:count, data: streets });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error });
  }
};

exports.active = async (req, res) => {
  try {
    const streets = await Street.findAll({ order: [["id", "ASC"]] },{where: {status: "Active"}});
    const count = await Street.count({where: {status: "Active"}});
    return res.status(200).json({ success: true,total:count, data: streets });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error });
  }
};

exports.inactive = async (req, res) => {
  try {
    const streets = await Street.findAll({ order: [["id", "ASC"]] },{where: {status: "Inactive"}});
    const count = await Street.count({where: {status: "Inactive"}});
    return res.status(200).json({ success: true,total:count, data: streets });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error });
  }
};

exports.underMaintenance = async (req, res) => {
  try {
    const streets = await Street.findAll({ order: [["id", "ASC"]] },{where: {status: "Under Maintainance"}});
    const count = await Street.count({where: {status: "Under Maintainance"}});
    return res.status(200).json({ success: true,total:count, data: streets });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error });
  }
};
exports.single = async (req, res) => {
  const { id } = req.params;
 if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Street id not provided" });
  try {
    const streets = await Street.findAll({where: {id}});
    console.log(streets)
    if(!streets){
       return res
      .status(404)
      .json({ success: false, message: "Street not found" });
    }
    return res.status(200).json({ success: true, data: streets });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error });
  }
};
exports.update = async (req, res) => {
  const { id, streetCode, priority, status } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "Street ID  are required" });
  }
   if (!streetCode) {
    return res.status(400).json({ success: false, message: "Street code is required" });
  }
  if (!priority) {
    return res.status(400).json({ success: false, message: "priority is required" });
  }
  if (!status) {
    return res.status(400).json({ success: false, message: "status is required" });
  }

  try {
    const street = await Street.findByPk(id);
    if (!street) {
      return res.status(404).json({ success: false, message: "Street not found" });
    }
    console.log("My street: ",street);
    console.log("status: ",status)
    await Street.update({status, priority, streetCode},{where: {id}})

    return res.status(200).json({ success: true, message: "Street updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error });
  }
};

exports.changeStatus = async (req, res) => {
  const { id, status} = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "Street ID  are required" });
  }
   if (!status) {
    return res.status(400).json({ success: false, message: "status is required" });
  }
  if (status !== "Active" || status !== "Inactive" || status !== "Under Maintainance") {
    return res.status(400).json({ success: false, message: "status must be either 'Active', 'Inactive' or 'Under Maintainance'" });
  }
  try {
    const street = await Street.findByPk(id);
    if (!street) {
      return res.status(404).json({ success: false, message: "Street not found" });
    }

    street.status = status;
    await street.save();

    return res.status(200).json({ success: true, message: "Street updated successfully", data: street });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error });
  }
};
exports.delete = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "Street ID is required" });
  }

  try {
    const street = await Street.findByPk(id);
    if (!street) {
      return res.status(404).json({ success: false, message: "Street not found" });
    }

    await street.destroy();
    const today = new Date().toISOString().split("T")[0];
    await Shift.destroy({
      where: {
        date: {
          [Op.gte]: today
        }
      }
    });

      const shifts = await generateWeeklyScheduleData();
      await Shift.bulkCreate(shifts);
    return res.status(200).json({ success: true, message: "Street deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error });
  }
};
