import { Op, Sequelize } from "sequelize";
import db from "../../models/eyes-donation";
import type { AppRole, UserStatus } from "../../models/eyes-donation/users";

export const VALID_APP_ROLES: AppRole[] = ["eye", "organ", "both", "admin"];
export const VALID_USER_STATUSES: UserStatus[] = ["pending", "active", "suspended"];

export interface UserIdentityInput {
  provider_id?: string | null;
  name?: string | null;
  position?: string | null;
  hospcode?: string | null;
}

export function isValidAppRole(val: unknown): val is AppRole {
  return typeof val === "string" && VALID_APP_ROLES.includes(val as AppRole);
}

export function isValidUserStatus(val: unknown): val is UserStatus {
  return typeof val === "string" && VALID_USER_STATUSES.includes(val as UserStatus);
}

export class UserRoleService {
  /**
   * ค้นหาผู้ใช้จาก provider_id ในตาราง users
   * หากยังไม่เคยมีในระบบ:
   * - ผู้ใช้คนแรก → admin + status = 'active'
   * - ผู้ใช้ใหม่คนถัดไป → status = 'pending' (รออนุมัติสิทธิ์จาก Admin)
   */
  static async resolveOrCreateUser(
    identity: UserIdentityInput,
    options: { touchLastLogin?: boolean } = {},
  ) {
    const providerId = (identity.provider_id || "").trim();

    if (!providerId) {
      return null;
    }

    let userRecord = await db.User.findOne({
      where: { provider_id: providerId },
    });

    const cleanName = identity.name?.trim();
    const cleanPosition = identity.position?.trim();
    const cleanHospcode = identity.hospcode?.trim();

    if (userRecord) {
      const updates: Record<string, unknown> = {};
      if (
        cleanName &&
        cleanName !== "-" &&
        cleanName !== "เจ้าหน้าที่" &&
        cleanName !== userRecord.name
      ) {
        updates.name = cleanName;
      }
      if (cleanPosition && cleanPosition !== userRecord.position) {
        updates.position = cleanPosition;
      }
      if (cleanHospcode && cleanHospcode !== userRecord.hospcode) {
        updates.hospcode = cleanHospcode;
      }
      if (options.touchLastLogin) {
        updates.last_login_at = new Date();
      }
      if (Object.keys(updates).length > 0) {
        await userRecord.update(updates);
      }
      return userRecord;
    }

    const totalUsers = await db.User.count();
    const isFirstUser = totalUsers === 0;
    const defaultRole: AppRole = isFirstUser ? "admin" : "eye";
    const defaultStatus: UserStatus = isFirstUser ? "active" : "pending";

    userRecord = await db.User.create({
      provider_id: providerId,
      name: cleanName || "เจ้าหน้าที่",
      position: cleanPosition || null,
      hospcode: cleanHospcode || null,
      app_role: defaultRole,
      status: defaultStatus,
      is_active: isFirstUser,
      last_login_at: options.touchLastLogin ? new Date() : null,
    });

    return userRecord;
  }

  static async listUsers(search?: string) {
    const where: any = {};
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { provider_id: { [Op.like]: q } },
        { name: { [Op.like]: q } },
        { position: { [Op.like]: q } },
        { hospcode: { [Op.like]: q } },
      ];
    }

    const users = await db.User.findAll({
      where,
      order: [
        [
          Sequelize.literal(
            "CASE status WHEN 'pending' THEN 0 WHEN 'active' THEN 1 ELSE 2 END",
          ),
          "ASC",
        ],
        ["app_role", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    return users.map((u: any) => (u.toJSON ? u.toJSON() : u));
  }

  static async createUser(body: {
    provider_id?: string | null;
    providerId?: string | null;
    cid?: string | null;
    name: string;
    position?: string | null;
    hospcode?: string | null;
    app_role?: AppRole;
    status?: UserStatus;
    is_active?: boolean;
  }) {
    const providerId = String(body.provider_id || body.providerId || body.cid || "").trim();
    const name = String(body.name || "").trim();
    if (!providerId) throw new Error("กรุณาระบุ Provider ID");
    if (!name) throw new Error("กรุณาระบุชื่อ-สกุลผู้ใช้งาน");

    const appRole: AppRole = isValidAppRole(body.app_role) ? body.app_role : "eye";
    const status: UserStatus = isValidUserStatus(body.status)
      ? body.status
      : body.is_active === false
        ? "suspended"
        : "active";

    const existing = await db.User.findOne({ where: { provider_id: providerId } });
    if (existing) {
      throw new Error(`ผู้ใช้งาน Provider ID ${providerId} มีอยู่ในระบบแล้ว`);
    }

    const created = await db.User.create({
      provider_id: providerId,
      name,
      position: body.position?.trim() || null,
      hospcode: body.hospcode?.trim() || null,
      app_role: appRole,
      status,
      is_active: status === "active",
    });

    return created.toJSON ? created.toJSON() : created;
  }

  static async updateUser(
    id: number,
    body: {
      name?: string;
      position?: string | null;
      hospcode?: string | null;
      app_role?: AppRole;
      status?: UserStatus;
      is_active?: boolean;
    },
  ) {
    const target = await db.User.findByPk(id);
    if (!target) {
      throw new Error("ไม่พบข้อมูลผู้ใช้งานที่ต้องการแก้ไข");
    }

    if (body.app_role !== undefined && !isValidAppRole(body.app_role)) {
      throw new Error("สิทธิ์ผู้ใช้งานต้องเป็น eye, organ, both หรือ admin เท่านั้น");
    }

    if (body.status !== undefined && !isValidUserStatus(body.status)) {
      throw new Error("สถานะผู้ใช้งานต้องเป็น pending, active หรือ suspended เท่านั้น");
    }

    let nextStatus: UserStatus | undefined = body.status;
    if (nextStatus === undefined && body.is_active !== undefined) {
      nextStatus = body.is_active ? "active" : "suspended";
    }

    const isCurrentlyActiveAdmin =
      target.app_role === "admin" && target.status === "active";
    const willDemoteAdmin =
      isCurrentlyActiveAdmin &&
      ((body.app_role !== undefined && body.app_role !== "admin") ||
        (nextStatus !== undefined && nextStatus !== "active"));

    if (willDemoteAdmin) {
      const activeAdmins = await db.User.count({
        where: { app_role: "admin", status: "active" },
      });
      if (activeAdmins <= 1) {
        throw new Error("ไม่สามารถเปลี่ยนสิทธิ์หรือปิดการใช้งานผู้ดูแลระบบคนสุดท้ายได้");
      }
    }

    await target.update({
      ...(body.name !== undefined && body.name.trim() !== ""
        ? { name: body.name.trim() }
        : {}),
      ...(body.position !== undefined
        ? { position: body.position ? String(body.position).trim() || null : null }
        : {}),
      ...(body.hospcode !== undefined
        ? { hospcode: body.hospcode ? String(body.hospcode).trim() || null : null }
        : {}),
      ...(body.app_role !== undefined ? { app_role: body.app_role } : {}),
      ...(nextStatus !== undefined
        ? { status: nextStatus, is_active: nextStatus === "active" }
        : {}),
    });

    return target.toJSON ? target.toJSON() : target;
  }

  static async deleteUser(id: number) {
    const target = await db.User.findByPk(id);
    if (!target) {
      throw new Error("ไม่พบข้อมูลผู้ใช้งานที่ต้องการลบ");
    }

    if (target.app_role === "admin" && target.status === "active") {
      const activeAdmins = await db.User.count({
        where: { app_role: "admin", status: "active" },
      });
      if (activeAdmins <= 1) {
        throw new Error("ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้");
      }
    }

    const providerId = target.provider_id;
    await target.destroy();
    return { message: "ลบข้อมูลผู้ใช้งานสำเร็จ", provider_id: providerId };
  }
}
