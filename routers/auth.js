import express from "express";
import {
  sendOtp,
  upload,
  userLogin,
  userRegister,
  userVerify,
  verifyOtp,
} from "../controllers/authController.js";
import { accessMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/login", userLogin);
router.post("/register", upload.single("image"), userRegister);
router.post("/sendOtp", sendOtp);
router.post("/verifyOtp", verifyOtp);
router.get("/verify", accessMiddleware, userVerify);

export default router;
