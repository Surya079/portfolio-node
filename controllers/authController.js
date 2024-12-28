import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import nodemailer from "nodemailer";
import Users from "../models/user_model.js";
import env from "dotenv";
import jwt from "jsonwebtoken";
import { OTP } from "../models/otp_model.js";

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
    fileSize: 25 * 1024 * 1024,
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

const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "email are required",
    });
  }
  try {
    const otpCode = generateOTP();
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    const otpExpiryTime = new Date(Date.now() + 5 * 60 * 1000); // Expires in 5 minutes

    const user = await Users.findOne({ email });

    await OTP.findOneAndUpdate(
      { userId: user._id },
      {
        otp: hashedOtp,
        OTPExpiry: otpExpiryTime,
      }
    ).populate("userId");

    const mailOptions = {
      from: trans_mail,
      to: email,
      subject: "OTP Verification",
      html: `
        <h1>OTP Verification</h1>
        <p>Your OTP for registration is: <strong>${otpCode}</strong></p>
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
          message: "OTP sent to your email successfully",
        });
      })
      .catch((err) => {
        res.status(500).json({
          success: false,
          message: "Error sending OTP to email",
        });
      });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message || "Error sending OTP",
    });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!otp) {
    return res.status(400).json({
      success: false,
      message: " OTP is required",
    });
  }
  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  try {
    // Find the OTP record for the user
    const user = await Users.findOne({ email });

    const otpRecord = await OTP.findOne({
      userId: user._id,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "You have already verified.",
      });
    }

    if (otpRecord.OTPExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // Verify if the provided OTP matches the hashed OTP in the database
    const isOtpValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    await Users.findOneAndUpdate(
      { email: email },
      {
        isVerified: "verified",
      }
    );
    // Send confirmation email
    const mailOptions = {
      from: trans_mail,
      to: email,
      subject: "OTP Verified Successfully",
      html: `
        <h1>Congratulations!</h1>
        <p>Your email has been successfully verified.</p>
        <p>You can now access all the features of your account. Welcome to our platform!</p>
        <p>If you need assistance, feel free to reach out.</p>
        <p>Visit our website: <a href="http://yourportfolio.com">http://yourportfolio.com</a></p>
      `,
    };
    transporter
      .sendMail(mailOptions)
      .then((_) => {
        res.status(201).json({
          success: true,
          message:
            "OTP verified successfully! A confirmation email has been sent to your inbox.",
        });
      })
      .catch((_) => {
        res.status(500).json({
          success: false,
          message: "Error verifying OTP",
        });
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error during OTP verification",
    });
  }
};

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
      expiresIn: "5m",
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
    });

    await user.save();

    await OTP.create({
      userId: user._id,
      otp: await bcrypt.hash(otp, 10),
      OTPExpiry: otpExpiryTime,
    });

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
          message: "OTP sent to your email successfully",
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

const userVerify = async (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
};
export { userLogin, userRegister, userVerify, sendOtp, verifyOtp };
