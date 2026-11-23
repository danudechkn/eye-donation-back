import { Request, Response } from "express";
import { UserRoleService } from "../services/user/userRole.service";
import { emitUserChanged } from "../socket";

export class AdminUserController {
  static async listUsers(req: Request, res: Response) {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const users = await UserRoleService.listUsers(search);
      return res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "ไม่สามารถโหลดรายชื่อผู้ใช้งานได้",
      });
    }
  }

  static async createUser(req: Request, res: Response) {
    try {
      const created = await UserRoleService.createUser(req.body || {});
      emitUserChanged("created", {
        id: created?.id,
        provider_id: created?.provider_id,
        app_role: created?.app_role,
        status: created?.status,
        is_active: created?.is_active,
        name: created?.name,
      });
      return res.status(201).json({
        success: true,
        message: "เพิ่มผู้ใช้งานสำเร็จ",
        data: created,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "ไม่สามารถเพิ่มผู้ใช้งานได้",
      });
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      const updated = await UserRoleService.updateUser(id, req.body || {});
      emitUserChanged("updated", {
        id: updated?.id,
        provider_id: updated?.provider_id,
        app_role: updated?.app_role,
        status: updated?.status,
        is_active: updated?.is_active,
        name: updated?.name,
      });
      return res.status(200).json({
        success: true,
        message: "อัปเดตสิทธิ์ผู้ใช้งานสำเร็จ",
        data: updated,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "ไม่สามารถอัปเดตสิทธิ์ผู้ใช้งานได้",
      });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      const result = await UserRoleService.deleteUser(id);
      emitUserChanged("deleted", {
        id,
        provider_id: result.provider_id,
      });
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "ไม่สามารถลบผู้ใช้งานได้",
      });
    }
  }
}

export default AdminUserController;
