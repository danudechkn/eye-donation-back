import express from "express";
import { AdminUserController } from "../controllers/adminUser.controller";
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware";

const router = express.Router();

router.use(authenticateToken, authorizeRoles("admin"));

// GET /api/admin/users - ดึงรายชื่อผู้ใช้งานและสิทธิ์ทั้งหมด
router.get("/users", AdminUserController.listUsers);

// POST /api/admin/users - เพิ่มผู้ใช้งานและกำหนดสิทธิ์ล่วงหน้า
router.post("/users", AdminUserController.createUser);

// PUT /api/admin/users/:id - แก้ไขสิทธิ์ / เปิด-ปิดการใช้งาน
router.put("/users/:id", AdminUserController.updateUser);

// DELETE /api/admin/users/:id - ลบผู้ใช้งาน
router.delete("/users/:id", AdminUserController.deleteUser);

export default router;
