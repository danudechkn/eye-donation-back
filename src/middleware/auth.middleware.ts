import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "eye_donation_secret_key_12345";

export const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // รับ Token จาก Header
    const authHeader = req.headers["authorization"] || req.headers["x-api-token"];

    if (!authHeader) {
        res.status(401).json({
            status: "error",
            message: "Access Denied. No token provided.",
        });
        return;
    }

    let token = authHeader.toString();
    if (token.startsWith("Bearer ")) {
        token = token.slice(7, token.length);
    }

    // เทียบกับ Token ที่ตั้งไว้ใน .env (สำหรับ API ปกติ หรือ Server to Server)
    const validStaticToken = process.env.API_TOKEN;

    if (token === validStaticToken) {
        // ถ้าเป็น Token คงที่จาก .env ให้ผ่านได้เลย
        return next();
    }

    // ถ้าไม่ใช่ Static Token ลองแกะเป็น JWT (ที่ได้จากการล็อกอิน MOPH)
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // (Optional) แนบข้อมูล user เข้าไปใน request เผื่อ API อื่นอยากใช้
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
