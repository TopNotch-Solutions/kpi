const { where, Op } = require("sequelize");
const User = require("../models/user");

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
exports.allDevices = async (req, res) => {
    try {
    
    const totalCount = await User.count({
  where: {
    device: {
      [Op.and]: [
        { [Op.not]: null },
        { [Op.ne]: "" }
      ]
    }
  }
});

    return res.status(200).json({
      status: true,
      message: "Device count retrieved successfully",
      total: totalCount,
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error,
    });
  }
}