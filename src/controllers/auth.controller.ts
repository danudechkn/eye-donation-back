import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "12h") as string;

export class AuthController {
  /**
   * ตรวจสอบสถานะความถูกต้องของ Token พร้อมดึงข้อมูลผู้ใช้งานปัจจุบัน
   * GET /api/me หรือ GET /api/auth/me (รวม getMe และ verifyToken)
   */
  static async getMe(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({
          success: false,
          valid: false,
          message: "ไม่พบข้อมูลผู้ใช้งาน หรือ Token ไม่ถูกต้อง",
        });
      }

      return res.status(200).json({
        success: true,
        valid: true,
        user,
        data: user,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        valid: false,
        message: error.message || "เกิดข้อผิดพลาดในการตรวจสอบ Token หรือดึงข้อมูลผู้ใช้งาน",
      });
    }
  }

  // Alias สำหรับ backward compatibility หากมี client เรียก verifyToken
  static verifyToken = AuthController.getMe;

  /**
   * สร้าง/ออก Token สำหรับทดสอบหรือเข้าสู่ระบบภายใน (Mock/Direct Login)
   * POST /api/login หรือ POST /api/auth/login
   */
  static async login(req: Request, res: Response) {
    try {
      const { username, cid, name, role, hospcode } = req.body;

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
}

export default AuthController;
