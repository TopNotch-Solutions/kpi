const { where, Op } = require("sequelize");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const generateRandomString = require("../utils/generateString");
const { createToken } = require("../utils/createToken");
const OTP = require("../models/otp");
const crypto = require("crypto");
const { Shift } = require("../models");
const getNextWeekDates = require("../utils/getDate");
const { generateWeeklyScheduleData } = require("../utils/weeklySchedule");
const Street = require("../models/street");
require("dotenv").config();

exports.signup = async (req, res) => {
  let { firstname, lastname, email, phoneNumber, role, device } = req.body;

  if (!firstname || !lastname || !phoneNumber || !role) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  if (role !== "Marshall" && !email) {
    return res.status(400).json({ success: false, message: "Email not provided" });
  }

  const password = generateRandomString();

  try {
    const alreadyExisting = await User.findOne({
      where: { phoneNumber, firstName: firstname, lastName: lastname },
    });

    if (alreadyExisting) {
      return res.status(406).json({ success: false, message: "User already exists" });
    }

    const newPassword = role !== "Marshall" ? await bcrypt.hash(password, await bcrypt.genSalt()) : null;

    await User.create({
      firstName: firstname,
      lastName: lastname,
      email: email || null,
      phoneNumber,
      password: newPassword,
      device,
      role,
    });

    if (role !== "Marshall") {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_FROM,
            pass: process.env.EMAIL_PASS,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: "KPI Onboarding",
          html: `<p>${firstname} ${lastname}, here is your password: <b>${password}</b>. Do not share it.</p>`,
        });
      } catch (mailErr) {
        console.error("Error sending email:", mailErr);
      }
    }

    return res.status(200).json({
      status: true,
      message: role === "Marshall" ? "Marshall created successfully." : "User successfully created.",
    });

  } catch (err) {
    console.error("Signup error:", err);
    if (role !== "Marshall") {
      await User.destroy({ where: { phoneNumber, firstName: firstname, lastName: lastname } });
    }
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};


exports.login = async (req, res) => {
  let { email, password } = req.body;
  if (!email)
    return res
      .status(400)
      .json({ success: false, message: "Email not provided" });
  if (!password)
    return res
      .status(400)
      .json({ success: false, message: "Password not provided" });

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "This account doesn't exist. Enter a different account.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid credentials" });
    }

    const token = createToken(user.id, user.role);
    if (!token) {
      return res
        .status(500)
        .json({ status: false, message: "Token generation failed" });
    }

    const newDetails = {
      id: user.id,
      firstname: user.firstName,
      lastname: user.lastName,
      email: user.email,
      contactNumber: user.phoneNumber,
      role: user.role,
    };

    return res.status(200).json({
      status: true,
      message: "Login successful",
      token,
      details: newDetails,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, message: "Internal server error", err });
  }
};

exports.userDetails = async (req, res) => {
   const { email } = req.body;
   if (!email)
    return res
      .status(400)
      .json({ success: false, message: "Email not provided" });
      try {
    const existingUser = await User.findOne({ where: { email } });
    if (!existingUser) {
      return res
        .status(404)
        .json({ status: false, message: "User not found!" });
    }
    console.log(existingUser)
    return res.status(200).json({status: true, message: "User successfully retrieved!", data: existingUser})
  }catch (err) {
    return res
      .status(500)
      .json({ status: false, message: "Internal server error", err });
  }

}


exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res
      .status(400)
      .json({ success: false, message: "Email not provided" });

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (!existingUser) {
      return res
        .status(404)
        .json({ status: false, message: "User not found!" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const resetLink = `http://localhost:3000/reset-password?token=${token}&userId=${existingUser.id}`;
    const salt = await bcrypt.genSalt();
    const hashedOTP = await bcrypt.hash(token, salt);

    await OTP.destroy({ where: { userId: existingUser.id } });

    await OTP.create({
      userId: existingUser.id,
      otp: hashedOTP,
      role: existingUser.role,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    });

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      logger: true,
      debug: true,
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "KPI Forgot Password Verification",
      html: `
          <p>Hello ${existingUser.firstName},</p>
          <p>You requested to reset your password. Click the link below to proceed. This link will expire in 1 hour:</p>
          <p><a href="${resetLink}">Reset Password</a></p>
          <p>If you did not request this, please ignore this email.</p>
        `,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json({ status: true, message: "Reset link sent successfully." });
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, message: "Internal server error", err });
  }
};
exports.changePassword = async (req, res) => {
  let { newPassword, confirmPassword, userId } = req.body;
  if (!newPassword)
    return res
      .status(400)
      .json({ success: false, message: "New password not provided" });
  if (!confirmPassword)
    return res
      .status(400)
      .json({ success: false, message: "Confirm password not provided" });
  if (!userId)
    return res
      .status(400)
      .json({ success: false, message: "User id not provided" });
  try {
    const existingUser = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (!existingUser) {
      return res
        .status(404)
        .json({ status: false, message: "User not found!" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(404).json({
        status: false,
        message: "New password and the Confirm password provided do not match.",
      });
    }
    const salt = await bcrypt.genSalt();
    const newPasswordHashed = await bcrypt.hash(newPassword, salt);

    await User.update(
      { password: newPasswordHashed },
      {
        where: {
          id: userId,
        },
      }
    );
    return res.status(200).json({
      status: true,
      message: "User Password successfully updated",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, message: "Internal server error", err });
  }
};
exports.newPassword = async (req, res) => {};
exports.details = async (req, res) => {
  let { email, phoneNumber, userId } = req.body;
  if (!email)
    return res
      .status(400)
      .json({ success: false, message: "email not provided" });
  if (!phoneNumber)
    return res
      .status(400)
      .json({ success: false, message: "phone number not provided" });
  if (!userId)
    return res
      .status(400)
      .json({ success: false, message: "user id not provided" });
  try {
    const isUser = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!isUser) {
      return res.status(404).json({
        status: false,
        message: "Account record doesn't exist",
      });
    }
    await User.update(
      { email, phoneNumber },
      {
        where: { id: userId },
      }
    );
    const user = await User.findOne({where: {id:userId}});
    const newUser = {
      id: user.id,
      firstname: user.firstName,
      lastname: user.lastName,
      email: user.email,
      contactNumber: user.phoneNumber,
      role: user.role,
    };
    return res.status(200).json({
      status: true,
      message: "User details successfully updated",
      currentUser: newUser
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, message: "Internal server error", err });
  }
};
exports.detailsUser = async (req, res) => {
  let { firstname, lastname, email, phoneNumber, role, device } = req.body;
  let { userId } = req.params;
  if (!firstname)
    return res
      .status(400)
      .json({ success: false, message: "first name not provided" });
  if (!lastname)
    return res
      .status(400)
      .json({ success: false, message: "last name not provided" });
  if (!email)
    return res
      .status(400)
      .json({ success: false, message: "email not provided" });
  if (!phoneNumber)
    return res
      .status(400)
      .json({ success: false, message: "phone number not provided" });
  if (!userId)
    return res
      .status(400)
      .json({ success: false, message: "user id not provided" });
  try {
    const isUser = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!isUser) {
      return res.status(404).json({
        status: false,
        message: "Account record doesn't exist",
      });
    }
    if (role !== "Marshall") {
      await User.update(
        { firstName: firstname, lastName: lastname, email, phoneNumber, role },
        {
          where: { id: userId },
        }
      );
      return res.status(200).json({
        status: true,
        message: "User details successfully updated",
      });
    } else {
      await User.update(
        {
          firstName: firstname,
          lastName: lastname,
          email,
          phoneNumber,
          role,
          device: device || "",
          password: null,
        },
        {
          where: { id: userId },
        }
      );
      return res.status(200).json({
        status: true,
        message: "User details successfully updated",
      });
    }
  } catch (err) {
    if (role !== "Marshall") {
      await User.destroy({ where: { phoneNumber } });
    }
    return res
      .status(500)
      .json({ status: false, message: "Internal server error", err });
  }
};
exports.delete = async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "User ID not provided" });
  }
  console.log("My email" , userId)
  try {
    const isUser = await User.findOne({ where: { email: userId } });
    console.log(isUser)
    if (!isUser) {
      return res.status(404).json({
        status: false,
        message: "Account record doesn't exist",
      });
    }

    if (isUser.role === "Marshall") {
      const today = new Date().toISOString().split("T")[0];
      await Shift.destroy({
        where: {
          date: {
            [Op.gte]: today,
          },
        },
      });

      await User.destroy({ where: { id: isUser.id } });
      const existingStreet = await Street.count();
    if(existingStreet === 0){
      return res
      .status(200)
      .json({ success: true, message: "User successfully deleted and marshalls reassigned (if applicable)." });
    }
    const existingMarshall = await User.count({where: {role: "Marshall"}});
     if(existingMarshall === 0){
       return res
      .status(200)
      .json({ success: true, message: "User successfully deleted and marshalls reassigned (if applicable)." });
    }
      const shifts = await generateWeeklyScheduleData();
      await Shift.bulkCreate(shifts);
      console.log("deleting user.......................",userId)
      return res.status(200).json({
        status: true,
        message: "Marshall successfully deleted and schedule updated.",
      });
    } else {
      await User.destroy({ where: { id: isUser.id } });

      return res.status(200).json({
        status: true,
        message: "Admin successfully deleted",
      });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, message: "Internal server error", err });
  }
};
