import jwt from "jsonwebtoken";
import Users from "../models/user_model.js";
import env from "dotenv";
env.config();

const accessMiddleware = async (req, res, next) => {
  try {
    const token = req?.headers?.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Access denied. Token not provided" });
    }

    const secretKey = process?.env?.SCERET;

    const decoded = jwt.verify(token, secretKey);
    const currentUser = await Users.findById(decoded.id);

    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please log in again.",
      });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(403).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }
    return res.status(500).json({
      success: false,
      message: `Internal Server Error: ${error.message}`,
    });
  }
};

export { accessMiddleware };
