import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "eye_donation_secret_key_12345";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "12h";

export class AuthController {
  /**
   * ดึงข้อมูลผู้ใช้งานปัจจุบันจาก Token ที่ผ่านการ Verify แล้ว
   * GET /api/me หรือ GET /api/auth/me
   */
  static async getMe(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "ไม่พบข้อมูลผู้ใช้งาน หรือ Token ไม่ถูกต้อง",
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน",
      });
    }
  }

  /**
   * สร้าง/ออก Token สำหรับทดสอบหรือเข้าสู่ระบบภายใน (Mock/Direct Login)
   * POST /api/login หรือ POST /api/auth/login
   */
  static async login(req: Request, res: Response) {
    try {
      const { username, password, cid, name, role, hospcode } = req.body;

      // ตัวอย่าง payload รองรับโครงสร้างตามระบบบริจาคดวงตา / Provider ID
      const userPayload = {
        cid: cid || "1234567890123",
        name: name || username || "เจ้าหน้าที่ประสานงาน",
        role: role || "staff",
        hospcode: hospcode || "10664",
      };

      const token = jwt.sign(userPayload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN as any,
      });

      return res.status(200).json({
        success: true,
        token,
        user: userPayload,
        message: "เข้าสู่ระบบสำเร็จ",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
      });
    }
  }

  /**
   * ตรวจสอบสถานะความถูกต้องของ Token
   * GET /api/verify หรือ GET /api/auth/verify
   */
  static async verifyToken(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      return res.status(200).json({
        success: true,
        valid: true,
        user,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        valid: false,
        message: error.message || "Token ไม่ถูกต้องหรือไม่สามารถใช้งานได้",
      });
    }
  }
}

export default AuthController;
