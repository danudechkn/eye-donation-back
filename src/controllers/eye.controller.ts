
import { Request, Response } from "express";
import { SearchPatService } from "../services/pat/serchPat.service";
import { CreateDonationService } from "../services/donation/createdonation.service";
import { DonationIndexService } from "../services/donation/index.service";
import { UpdateDonationService } from "../services/donation/updeatedonation.service";
import { DeleteDonationService } from "../services/donation/deletedonation.service";
import { MophEyeDonationService } from "../services/moph/mophEyeDonation.service";
import { emitCaseChanged } from "../socket";

export class EyeController {
  static async getDeceasedPatients(req: Request, res: Response) {
    try {
      const hn = req.query.hn as string;
      if (!hn) {
        return res.status(400).json({ success: false, message: "hn is required" });
      }

      const patients = await SearchPatService.searchPat(hn);
      res.status(200).json({
        success: true,
        data: patients
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
  static async createDonorConsent(req: Request, res: Response) {
    try {
      const { body } = req;
      const user = (req as any).user;
      const result = await CreateDonationService.createDonorConsent(body, user);
      emitCaseChanged("created", {
        id: result?.id,
        hn: result?.hn || body?.hn,
        actor: user?.name || user?.name_th,
      });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  static async getDonorCases(req: Request, res: Response) {
    try {
      const query = req.query;
      const result = await DonationIndexService.index(query);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getDonorCaseById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID in URL",
        });
      }

      const result = await DonationIndexService.getById(id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  static async updateDonorConsent(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      // ดักจับกรณีที่ไม่ได้ส่ง id มาใน URL หรือค่าไม่ใช่ตัวเลข
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID in URL (กรุณาระบุ ID ใน URL ให้ถูกต้อง)"
        });
      }

      await UpdateDonationService.updateDonorConsent(id, req.body);
      emitCaseChanged("updated", {
        id,
        hn: req.body?.hn,
        actor: (req as any).user?.name || (req as any).user?.name_th,
      });
      return res
        .status(200)
        .json({
          success: true,
          message: "Donor consent updated successfully",
        });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async deleteDonorConsent(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID in URL"
        });
      }

      const result = await DeleteDonationService.deleteDonorConsent(id);
      emitCaseChanged("deleted", {
        id,
        actor: (req as any).user?.name || (req as any).user?.name_th,
      });
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  static async getStatistics(req: Request, res: Response) {
    try {
      const result = await DonationIndexService.getStatistics(req.query as any);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async sendToMoph(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID in URL (กรุณาระบุ ID ใน URL ให้ถูกต้อง)",
        });
      }

      const userToken = req.headers["authorization"] || (req.headers["x-api-token"] as string);
      const customPayload = req.body && Object.keys(req.body).length > 0 ? req.body : undefined;

      const result = await MophEyeDonationService.sendDonorCaseToMoph(id, userToken, customPayload);
      emitCaseChanged("moph_sent", {
        id,
        status: 2,
        actor: (req as any).user?.name || (req as any).user?.name_th,
      });
      return res.status(200).json({
        success: true,
        message: "ส่งข้อมูลไปยังระบบ MOPH สำเร็จ",
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || (error.missing_fields?.length ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        message: error.message || "เกิดข้อผิดพลาดในการส่งข้อมูลไป MOPH",
        missing_fields: error.missing_fields || [],
      });
    }
  }

  static async previewMophPayload(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID in URL",
        });
      }

      const result = await MophEyeDonationService.preparePayload(id);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async resetMophStatus(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID in URL",
        });
      }

      const result = await MophEyeDonationService.resetMophStatus(id);
      emitCaseChanged("moph_reset", {
        id,
        status: 1,
        actor: (req as any).user?.name || (req as any).user?.name_th,
      });
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
};