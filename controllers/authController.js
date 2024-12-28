import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import nodemailer from "nodemailer";
import Users from "../models/user_model.js";
import env from "dotenv";
import jwt from "jsonwebtoken";

env.config();
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, "public/images");
  },
  filename: (_req, file, callback) => {
    callback(null, Date.now() + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: function (req, file, cb) {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only images (jpeg, jpg, png) are allowed"));
    }
  },
});

const trans_mail = process.env.TRANSPORTER_EMAIL;
const trans_pass = process.env.TRANSPORTER_PASS;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: trans_mail,
    pass: trans_pass,
  },
});

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(404).json({ message: "All fields are required" });
    }
    const hasUser = await Users.findOne({ email });
    if (!hasUser) {
      return res.status(404).json({ message: "User doest't exists" });
    }

    const isPasswordMatch = await bcrypt.compare(password, hasUser.password);
    if (!isPasswordMatch) {
      return res.status(404).json({
        success: false,
        message: "Password doesn't Match",
      });
    }
    const scretkey = process.env.SCERET;
    const token = jwt.sign({ id: hasUser._id, name: hasUser.name }, scretkey, {
      expiresIn: "7d",
    });
    const current_user = [
      {
        username: hasUser.name,
        email: hasUser.email,
        occupation: hasUser.occupation,
        role: hasUser.role, // Role of the user
        isVerified: hasUser.isVerified,
      },
    ];
    res.status(200).json({
      success: true,
      current_user,
      message: "login successfully",
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Fetch Error",
    });
  }
};
const userRegister = async (req, res) => {
  try {
    const { name, email, password, occupation } = req.body;
    if (!name || !email || !password || !occupation) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const isUserExist = await Users.findOne({ email });

    if (isUserExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = generateOTP();
    const otpExpiryTime = new Date(Date.now() + 5 * 60 * 1000);

    const user = new Users({
      name,
      email,
      password: hashedPassword,
      occupation,
      profilePicture: req.file ? req.file.filename : "",
      OTP: await bcrypt.hash(otp, 10),
      OTPExpiry: otpExpiryTime,
    });

    await user.save();

    const mailOptions = {
      from: trans_mail,
      to: email,
      subject: "OTP Verification",
      html: `
        <h1>OTP Verification</h1>
        <p>Your OTP for registration is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 5 minutes. Please use it before ${otpExpiryTime.toLocaleString()}.</p>
        <p>After verification, you can proceed to log in to your account.</p>
        <p>If you need assistance, visit our portfolio website here: 
        <a href="http://yourportfolio.com">http://yourportfolio.com</a></p>
    `,
    };

    transporter
      .sendMail(mailOptions)
      .then((info) => {
        res.status(201).json({
          success: true,
          isVerified: "pending",
          message: "OTP sent to your email",
        });
      })
      .catch((err) => {
        res.status(500).json({
          success: false,
          message: "Error sending OTP to email",
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Fetch Error",
    });
  }
};

export { userLogin, userRegister };
