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

// ⚠️ Specific sub-routes ต้องมาก่อน wildcard /:id เสมอ
// POST /api/eye/donor-cases/send-moph/:id - ส่งข้อมูลเคสไปยังระบบ MOPH
router.post("/donor-cases/send-moph/:id", EyeController.sendToMoph);

// GET /api/eye/donor-cases/preview-moph/:id - ดูตัวอย่าง Payload ที่จะส่งให้ MOPH
router.get("/donor-cases/preview-moph/:id", EyeController.previewMophPayload);

// POST /api/eye/donor-cases/reset-moph-status/:id - รีเซ็ตสถานะกลับเป็น 1 (สำหรับทดสอบ)
router.post("/donor-cases/reset-moph-status/:id", EyeController.resetMophStatus);

// GET /api/eye/donor-cases/:id - ดึงข้อมูลเคสบริจาคดวงตาเดี่ยว
router.get("/donor-cases/:id", EyeController.getDonorCaseById);

// PUT /api/eye/donor-cases/:id - อัปเดตข้อมูลผู้ป่วย
router.put("/donor-cases/:id", EyeController.updateDonorConsent);

// DELETE /api/eye/donor-cases/:id - ลบข้อมูลผู้ป่วย
router.delete("/donor-cases/:id", EyeController.deleteDonorConsent);

// GET /api/eye/statistics - ดึงสถิติต่างๆ
router.get("/statistics", EyeController.getStatistics);

export default router;
