import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { UserRoleService } from "../services/user/userRole.service";
import type { AppRole, UserStatus } from "../models/eyes-donation/users";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // รับ Token จาก Header (Authorization: Bearer <token> หรือ x-api-token) หรือ Cookie
  let authHeader = req.headers["authorization"] || req.headers["x-api-token"];
  if (!authHeader && req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)(?:moph_token|token)=([^;]*)/);
    if (match) {
      authHeader = decodeURIComponent(match[1]);
    }
  }

  if (!authHeader) {
    res.status(401).json({
      success: false,
      status: "error",
      message: "Access Denied. No token provided.",
    });
    return;
  }

  let token = authHeader.toString().trim();
  if (token.startsWith("Bearer ")) {
    token = token.slice(7).trim();
  }

  // 1. ตรวจสอบกับ Static Token ใน .env (ถ้ามี เช่น สำหรับ Server-to-Server)
  const validStaticToken = process.env.API_TOKEN;
  if (validStaticToken && token === validStaticToken) {
    (req as any).user = {
      role: "system",
      appRole: "admin",
      userStatus: "active" as UserStatus,
      isActive: true,
      name: "System API",
    };
    return next();
  }

  // 2. ตรวจสอบ JWT Token (รองรับทั้ง Token ที่ระบบสร้างเอง และ Token จาก MOPH Provider ID)
  try {
    let decoded: any = null;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      // หากลายเซ็นเป็นของ MOPH IdP ให้ decode payload เพื่อตรวจโครงสร้าง
      decoded = jwt.decode(token);
    }

    if (!decoded || typeof decoded !== "object") {
      res.status(403).json({
        success: false,
        status: "error",
        message: "Invalid token format.",
      });
      return;
    }

    // ตรวจสอบวันหมดอายุ (exp)
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      res.status(403).json({
        success: false,
        status: "error",
        message: "Token has expired. Please login again.",
      });
      return;
    }

    // 3. ดึงสิทธิ์ appRole และสถานะบัญชี (pending / active / suspended) จากตาราง users
    let appRole: AppRole = "eye";
    let userStatus: UserStatus = "pending";
    let isActive = false;
    try {
      const rawProviderId =
        decoded.provider_id ||
        decoded.providerId ||
        decoded.provider?.provider_id ||
        decoded.cid ||
        decoded.pid ||
        decoded.sub;
      const resolvedProviderId =
        rawProviderId && String(rawProviderId).trim() !== "unknown"
          ? String(rawProviderId).trim()
          : undefined;

      const dbUser = await UserRoleService.resolveOrCreateUser({
        provider_id: resolvedProviderId,
        name: decoded.name || decoded.name_th || decoded.fullname || decoded.username,
        position: decoded.position || decoded.role,
        hospcode: decoded.hospcode,
      });

      if (dbUser) {
        appRole = dbUser.app_role;
        userStatus = dbUser.status || (dbUser.is_active ? "active" : "pending");
        isActive = userStatus === "active";
      }
    } catch (roleErr) {
      console.warn("[AuthMiddleware] Could not resolve user role from DB:", roleErr);
    }

    (req as any).user = {
      ...decoded,
      appRole,
      userStatus,
      isActive,
    };
    return next();
  } catch {
    res.status(403).json({
      success: false,
      status: "error",
      message: "Invalid or expired token.",
    });
    return;
  }
};

/** ตรวจสอบสถานะการอนุมัติและสิทธิ์การเข้าถึงตาม AppRole ('eye' | 'organ' | 'both' | 'admin') */
export const authorizeRoles = (...allowedRoles: AppRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    const appRole = user?.appRole as AppRole | undefined;

    if (!user?.isActive) {
      const isSuspended = user?.userStatus === "suspended";
      res.status(403).json({
        success: false,
        status: "error",
        message: isSuspended
          ? "บัญชีผู้ใช้งานนี้ถูกระงับสิทธิ์ชั่วคราว กรุณาติดต่อผู้ดูแลระบบ"
          : "บัญชีผู้ใช้งานนี้อยู่ระหว่างรออนุมัติสิทธิ์ กรุณาติดต่อผู้ดูแลระบบ",
      });
      return;
    }

    if (!appRole || !allowedRoles.includes(appRole)) {
      res.status(403).json({
        success: false,
        status: "error",
        message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้",
      });
      return;
    }

    next();
  };
};
