import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import nodemailer from "nodemailer";
import Users from "../models/user_model.js";

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "public/images");
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + path.extname(file.originalname));
  },
});

export const upload = multer({ storage: storage });

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

const userLogin = async (req, res) => {};
const userRegister = async (req, res) => {
  try {
    const { name, email, password, occupation } = req.body;

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
      OTP: otp,
      OTPExpiry: otpExpiryTime,
    });

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP Verification",
      text: `
        Your OTP for registration is: ${otp}
        
        This OTP is valid for 5 minutes. Please use it before ${otpExpiryTime.toLocaleString()}.
        
        After verification, you can proceed to log in to your account.

        If you need assistance, visit our portfolio website here: 
        http://yourportfolio.com
      `,
    });

    res.status(200).json({
      message:
        "OTP sent to your email. Please verify to complete registration.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Fetch Error",
    });
  }
};

export { userLogin, userRegister };
