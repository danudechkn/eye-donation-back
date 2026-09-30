import { Request, Response } from "express";
import { SearchPatService } from "../services/pat/serchPat.service";
import { CreateDonationService } from "../services/donation/createdonation.service";
import { DonationIndexService } from "../services/donation/index.service";
import { UpdateDonationService } from "../services/donation/updeatedonation.service";
import { DeleteDonationService } from "../services/donation/deletedonation.service";

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
      const result = await CreateDonationService.createDonorConsent(body);
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
};