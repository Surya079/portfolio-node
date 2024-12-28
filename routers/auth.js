import express from "express";
import {
  upload,
  userLogin,
  userRegister,
} from "../controllers/authController.js";
const router = express.Router();

router.post("/login", userLogin);
router.post("/register", upload.single("image"), userRegister);

export default router;
