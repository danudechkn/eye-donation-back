import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UserRoleService } from "../services/user/userRole.service";
import type { AppRole, UserStatus } from "../models/eyes-donation/users";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "12h") as string;

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true",
  sameSite: (process.env.COOKIE_SAMESITE as "lax" | "strict" | "none") || "lax",
  path: "/",
});

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
   * และบันทึก Token ลงใน HttpOnly Cookie
   * POST /api/login หรือ POST /api/auth/login
   */
  static async login(req: Request, res: Response) {
    try {
      const body = req.body || {};
      const {
        username,
        providerId,
        provider_id,
        name,
        role,
        hospcode,
        token: externalToken,
      } = body;
      const provider = body.provider || body.data?.provider;
      const healthId = body.health_id || body.data?.health_id;

      let token: string;
      let userPayload: any;

      if (externalToken && typeof externalToken === "string") {
        token = externalToken.trim();
        const decoded: any = jwt.decode(token);
        userPayload =
          decoded && typeof decoded === "object"
            ? { ...decoded }
            : { name: name || username || "เจ้าหน้าที่ประสานงาน" };
      } else if (provider && typeof provider === "object") {
        const org =
          Array.isArray(provider.organization) && provider.organization.length > 0
            ? provider.organization[0]
            : undefined;
        const titleTh = typeof provider.title_th === "string" ? provider.title_th.trim() : "";
        const nameTh = typeof provider.name_th === "string" ? provider.name_th.trim() : "";
        const fullNameTh =
          titleTh && nameTh && !nameTh.startsWith(titleTh) ? `${titleTh}${nameTh}` : nameTh;

        userPayload = {
          account_id: provider.account_id || healthId?.account_id || null,
          health_account_id: healthId?.account_id || null,
          provider_id: provider.provider_id || null,
          title_th: titleTh || null,
          firstname_th: provider.firstname_th || null,
          lastname_th: provider.lastname_th || null,
          name_th: nameTh || null,
          name_eng: provider.name_eng || null,
          name: fullNameTh || provider.name_eng || name || username || "เจ้าหน้าที่ประสานงาน",
          email: provider.email || null,
          position: org?.position || null,
          position_id: org?.position_id || null,
          hospcode: org?.hcode || hospcode || "10664",
          hospname: org?.hname_th || null,
          role: role || "staff",
          health_id: healthId || undefined,
          provider,
        };

        token = jwt.sign(userPayload, JWT_SECRET, {
          expiresIn: JWT_EXPIRES_IN as any,
        });
      } else {
        // ตัวอย่าง payload รองรับโครงสร้างตามระบบบริจาคดวงตา / Provider ID
        const resolvedMockProviderId = provider_id || providerId || "PROVIDER_DEFAULT";
        userPayload = {
          provider_id: resolvedMockProviderId,
          name: name || username || "เจ้าหน้าที่ประสานงาน",
          role: role || "staff",
          hospcode: hospcode || "10664",
        };

        token = jwt.sign(userPayload, JWT_SECRET, {
          expiresIn: JWT_EXPIRES_IN as any,
        });
      }

      const rawProviderId =
        provider?.provider_id ||
        providerId ||
        provider_id ||
        userPayload.provider_id ||
        userPayload.providerId ||
        userPayload.provider?.provider_id ||
        body.cid ||
        userPayload.cid ||
        userPayload.pid ||
        userPayload.sub;
      const resolvedProviderId =
        rawProviderId && String(rawProviderId).trim() !== "unknown"
          ? String(rawProviderId).trim()
          : undefined;

      if (resolvedProviderId && !userPayload.provider_id) {
        userPayload.provider_id = resolvedProviderId;
      }

      let appRole: AppRole = "eye";
      let userStatus: UserStatus = "pending";
      let isActive = false;
      try {
        const dbUser = await UserRoleService.resolveOrCreateUser(
          {
            provider_id: resolvedProviderId,
            name:
              name ||
              userPayload.name ||
              userPayload.name_th ||
              userPayload.fullname ||
              username,
            position: userPayload.position || role || userPayload.role,
            hospcode: hospcode || userPayload.hospcode,
          },
          { touchLastLogin: true },
        );

        if (dbUser) {
          appRole = dbUser.app_role;
          userStatus = dbUser.status || (dbUser.is_active ? "active" : "pending");
          isActive = userStatus === "active";
        }
      } catch (roleErr) {
        console.warn("[AuthController.login] Could not resolve user role:", roleErr);
      }

      const cookieOptions = getCookieOptions();
      res.cookie("token", token, cookieOptions);

      return res.status(200).json({
        success: true,
        token,
        appRole,
        userStatus,
        isActive,
        user: {
          ...userPayload,
          appRole,
          userStatus,
          isActive,
        },
        message: isActive
          ? "เข้าสู่ระบบสำเร็จ"
          : userStatus === "suspended"
            ? "บัญชีผู้ใช้งานนี้ถูกระงับสิทธิ์ชั่วคราว กรุณาติดต่อผู้ดูแลระบบ"
            : "บันทึกคำขอเข้าใช้งานแล้ว กรุณารอผู้ดูแลระบบอนุมัติสิทธิ์",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
      });
    }
  }

  /**
   * ออกจากระบบและล้าง HttpOnly Cookie
   * POST /api/logout หรือ POST /api/auth/logout
   */
  static async logout(_req: Request, res: Response) {
    const clearOptions = getCookieOptions();
    res.clearCookie("token", clearOptions);
    res.clearCookie("moph_token", clearOptions);

    return res.status(200).json({
      success: true,
      message: "ออกจากระบบสำเร็จ",
    });
  }
}

export default AuthController;
