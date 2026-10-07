import express from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = express.Router();

// Public route สำหรับเข้าสู่ระบบหรือขอ Token ทดสอบ
router.post("/login", AuthController.login);

// Protected routes: ตรวจสอบความถูกต้องของ Token และส่งข้อมูลผู้ใช้ปัจจุบันกลับไป
router.get("/me", authenticateToken, AuthController.getMe);
router.get("/verify", authenticateToken, AuthController.getMe); // alias เพื่อรองรับ client เดิม

export default router;