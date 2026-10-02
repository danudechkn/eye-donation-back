import express from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = express.Router();

// Public route สำหรับเข้าสู่ระบบหรือขอ Token ทดสอบ
router.post("/login", AuthController.login);

// Protected routes ต้องส่ง Bearer token มาใน Header
router.get("/me", authenticateToken, AuthController.getMe);
router.get("/verify", authenticateToken, AuthController.verifyToken);

export default router;