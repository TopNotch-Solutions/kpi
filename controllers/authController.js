const { where } = require("sequelize");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const generateRandomString = require("../utils/generateString");

exports.signup = async (req, res) => {
    let { firstname, lastname, email, phoneNumber, role } = req.body;
    if (!firstname) return res.status(400).json({ success: false, message: "First name not provided" });
    if (!lastname) return res.status(400).json({ success: false, message: "Last name not provided" });
    if (!phoneNumber) return res.status(400).json({ success: false, message: "Phone number not provided" });
    if (!role) return res.status(400).json({ success: false, message: "Role not provided" });
    if (role !== "Marshall" && !email) return res.status(400).json({ success: false, message: "Email not provided" });

    const password = generateRandomString();

    try {
        const alreadyExisting = await User.findOne({
            where: { phoneNumber, firstName: firstname, lastName: lastname }
        });

        if (alreadyExisting) {
            return res.status(406).json({ success: false, message: "User already in the database" });
        }

        const salt = await bcrypt.genSalt();
        const newPassword = await bcrypt.hash(password, salt);

        await User.create({
            firstName: firstname,
            lastName: lastname,
            email: email ? email : null,
            phoneNumber,
            password: role !== "Marshall" ? newPassword : null,
            role
        });

        if (role !== "Marshall") {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_FROM,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: email,
                subject: "KPI Onboarding",
                html: `<p>${firstname} ${lastname}, Here is your password <b>${password}</b>. Do not share it with anyone.</p>`,
            };

            await transporter.sendMail(mailOptions);
        }

        return res.status(200).json({ status: true, message: "User successfully created." });

    } catch (err) {
        if (role !== "Marshall") {
            await User.destroy({ where: { phoneNumber } });
        }
        return res.status(500).json({ status: false, message: "Internal server error", err });
    }
}

exports.auth = async (req, res) => {
    try {
        const response = await fetch('http://41.182.255.20:8085/solar/api/auth', {
            method: 'GET',
            headers: {
                'Authorization': `Basic TVRDVGVzdDo/VGVnUVNLZjlGUCFuR25k`, 
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.scope && data.access_token && data.expires_in && data.token_type) {
            return res.status(200).json(data);
        } else {
            return res.status(500).json({ success: false, message: "Invalid response from external API", data });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Failed to call external auth API', error: error.message });
    }
}
exports.login = async (req, res) => {}
exports.forgotPassword = async (req, res) => {}
exports.changePassword = async (req, res) => {}
exports.newPassword = async (req, res) => {}
exports.details = async (req, res) => {}
exports.detailsUser = async (req, res) => {}
exports.profileImage = async (req, res) => {}
exports.delete = async (req, res) => {}