const { where } = require("sequelize");
const User = require("../models/user");
const Relationship = require("../models/relationship");

exports.allUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: {
        exclude: ['password'],
      },
      order: [['createdAt', 'DESC']],
    });

    const totalCount = await User.count();

    return res.status(200).json({
      status: true,
      message: "Users retrieved successfully",
      total: totalCount,
      users,
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error,
    });
  }
};

exports.allMarshalls = async (req, res) => {
    try {
    const users = await User.findAll({
        where:{role: "Marshall"},
      attributes: {
        exclude: ['password'], 
      },
      order: [['createdAt', 'DESC']], 
    });

    const totalCount = await User.count({
        where: {role: "Marshall"}
    });

    return res.status(200).json({
      status: true,
      message: "Marshall retrieved successfully",
      total: totalCount,
      users,
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error,
    });
  }
}
exports.allSupervisors = async (req, res) => {
    try {
    const users = await User.findAll({
        where:{role: "Supervisor"},
      attributes: {
        exclude: ['password'], 
      },
      order: [['createdAt', 'DESC']], 
    });

    const totalCount = await User.count({
        where: {role: "Supervisor"}
    });

    return res.status(200).json({
      status: true,
      message: "Supervisors retrieved successfully",
      total: totalCount,
      users,
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error,
    });
  }
}
exports.allAdmins = async (req, res) => {
    try {
    const users = await User.findAll({
        where:{role: "Admin"},
      attributes: {
        exclude: ['password'], 
      },
      order: [['createdAt', 'DESC']], 
    });

    const totalCount = await User.count({
        where:{role: "Admin"}
    });

    return res.status(200).json({
      status: true,
      message: "Admins retrieved successfully",
      total: totalCount,
      users,
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error,
    });
  }
}
exports.myMarshalls = async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, message: "Supervisor id not provided" });

  const existingSupervisor = await User.findOne({ where: { id } });

  if (!existingSupervisor) {
    return res.status(404).json({ status: false, message: "Supervisor not found" });
  }

  try {
    const allMarshalls = await Relationship.findAll({
      where: { supervisorId: id },
      attributes: ["marshallId"],
    });

    if (!allMarshalls || allMarshalls.length === 0) {
      return res.status(404).json({ status: false, message: "No marshalls found for the supervisor" });
    }

    const marshallIds = allMarshalls.map(rel => rel.marshallId);

    const marshallDetails = await User.findAll({
      where: { id: marshallIds },
      attributes: { exclude: ['password'] },
    });

    const count = await User.count({
         where: { id: marshallIds },
    })

    return res.status(200).json({
      status: true,
      message: "Marshalls retrieved successfully",
      total: count,
      data: marshallDetails,
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error,
    });
  }
};
