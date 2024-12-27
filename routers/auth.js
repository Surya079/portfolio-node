import express from "express";
import { upload, userRegister } from "../controllers/authController.js";
const router = express.Router();

router.post("/login");
router.post("/register", upload.single("image"), userRegister);

export default router;
