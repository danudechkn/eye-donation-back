import { Router } from "express";
import { EyeController } from "../controllers/eye.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// บังคับตรวจ Token ทุก Endpoint ในโมดูลบริจาคดวงตา
router.use(authenticateToken);

// GET /api/eye/deceased-patients - ดึงข้อมูลผู้ป่วยเสียชีวิตจาก ppkhosp
router.get("/deceased-patients", EyeController.getDeceasedPatients);
router.post("/deceased-patients", EyeController.createDonorConsent);

// GET /api/eye/donor-cases - ดึงรายการเคสบริจาคดวงตา พร้อมค้นหาและแบ่งหน้า
router.get("/donor-cases", EyeController.getDonorCases);

// GET /api/eye/donor-cases/:id - ดึงข้อมูลเคสบริจาคดวงตาเดี่ยว
router.get("/donor-cases/:id", EyeController.getDonorCaseById);

// PUT /api/eye/donor-cases/:id - อัปเดตข้อมูลผู้ป่วย
router.put("/donor-cases/:id", EyeController.updateDonorConsent);

// DELETE /api/eye/donor-cases/:id - ลบข้อมูลผู้ป่วย
router.delete("/donor-cases/:id", EyeController.deleteDonorConsent);

// GET /api/eye/statistics - ดึงสถิติต่างๆ
router.get("/statistics", EyeController.getStatistics);

export default router;
