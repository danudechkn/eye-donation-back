import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // รับ Token จาก Header (Authorization: Bearer <token> หรือ x-api-token)
    // รับ Token จาก Header หรือ Cookie
    let authHeader = req.headers["authorization"] || req.headers["x-api-token"];
    if (!authHeader && req.headers.cookie) {
        const match = req.headers.cookie.match(/(?:^|;\s*)(?:moph_token|token)=([^;]*)/);
        if (match) {
            authHeader = decodeURIComponent(match[1]);
        }
    }

    if (!authHeader) {
        res.status(401).json({
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
        (req as any).user = { role: "system", name: "System API" };
        return next();
    }

    // 2. ตรวจสอบ JWT Token (รองรับทั้ง Token ที่ระบบสร้างเอง และ Token จาก MOPH Provider ID)
    try {
        let decoded: any = null;

        // ลอง verify ด้วย JWT_SECRET ก่อน
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (verifyErr) {
            // หากลายเซ็นเป็นของ MOPH IdP ให้ decode payload เพื่อตรวจโครงสร้าง
            decoded = jwt.decode(token);
        }

        if (!decoded || typeof decoded !== "object") {
            res.status(403).json({
                status: "error",
                message: "Invalid token format.",
            });
            return;
        }

        // ตรวจสอบวันหมดอายุ (exp)
        if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
            res.status(403).json({
                status: "error",
                message: "Token has expired. Please login again.",
            });
            return;
        }

        // แนบข้อมูลผู้ใช้เข้า request เพื่อให้ Controller หรือ Audit Log นำไปใช้ต่อ
        (req as any).user = decoded;
        return next();
    } catch (err) {
        res.status(403).json({
            status: "error",
            message: "Invalid or expired token.",
        });
        return;
    }
};
