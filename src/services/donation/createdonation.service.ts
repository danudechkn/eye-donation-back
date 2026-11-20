import db from "../../models/eyes-donation";
import dbPPK from "../../models/ppkhosp";
import { CompletenessHelper } from "../../utils/completeness.helper";


export class CreateDonationService {
  private static resolveStaffName(user: any): string {
    if (!user || typeof user !== "object") {
      return "-";
    }

    const prefix = typeof (user.title_th || user.prefix) === "string" ? (user.title_th || user.prefix).trim() : "";
    const firstName =
      typeof (user.firstname_th || user.firstname || user.first_name) === "string"
        ? (user.firstname_th || user.firstname || user.first_name).trim()
        : "";
    const lastName =
      typeof (user.lastname_th || user.lastname || user.last_name) === "string"
        ? (user.lastname_th || user.lastname || user.last_name).trim()
        : "";
    const fullNameFromParts = [`${prefix}${firstName}`.trim(), lastName].filter(Boolean).join(" ").trim();

    const candidate =
      user.name_th ||
      user.fullname ||
      user.full_name ||
      user.name ||
      fullNameFromParts ||
      user.name_eng ||
      user.preferred_username ||
      user.username;

    return typeof candidate === "string" && candidate.trim() !== "" ? candidate.trim() : "-";
  }

  static async createDonorConsent(body: any, user?: any) {
    const transaction = await db.sequelize.transaction();
    try {
      const {
        hn,
        fullname,
        cid,
        deathtext,
        icd10,
        braincardiac,
        potential,
        chkpotential,
        commentnonchk,
        wardtotc,
        negotiate,
        negotiate_succ,
        commentnonnego,
        geteye,
        eyetotal,
        commentnoget,
        negotiate_staff,
        geteye_staff,
        geteye_place,
        firsttime,
        fristtime,
      } = body;

      const normalizeText = (val: unknown): string | null => {
        if (typeof val !== "string") return null;
        const trimmed = val.trim();
        return trimmed === "" ? null : trimmed;
      };

      const normalizedCid = normalizeText(cid);
      if (normalizedCid !== null && !/^\d{13}$/.test(normalizedCid)) {
        throw new Error("เลขบัตรประชาชน (CID) ต้องเป็นตัวเลขครบ 13 หลัก");
      }

      // ตรวจสอบฟิลด์บังคับ
      const fieldRequest = ["hn"];
      fieldRequest.forEach((item) => {
        if (!body[item]) {
          throw new Error(`${item} is required`);
        }
      });

      // 2. อนุญาตให้บันทึกได้แม้ไม่มีข้อมูลคนไข้ในระบบ PPK (ppkhosp)

      // ใช้ชื่อผู้ใช้งานที่ login อยู่ใส่ใน firststaff อัตโนมัติ (ไม่รับค่าจาก body)
      const firststaffValue = this.resolveStaffName(user);

      // จัดการกรณีส่ง firsttime หรือ fristtime มา (ถ้าส่งค่าว่างหรือไม่ได้ส่ง ให้เป็น null)
      let fristtimeValue = firsttime !== undefined ? firsttime : fristtime;
      if (!fristtimeValue || fristtimeValue === "") {
        fristtimeValue = null;
      }

      // คำนวณสถานะความครบถ้วนของข้อมูล (1 = ครบถ้วน, 0 = ไม่ครบถ้วน)
      const isCompleteValue = CompletenessHelper.calculateCompleteness({
        ...body,
        firststaff: firststaffValue,
        firsttime: fristtimeValue,
        fristtime: fristtimeValue,
      });

      // 3. บันทึกข้อมูลลง Database
      const donorData = await db.DonorCase.create(
        {
          hn,
          fullname: normalizeText(fullname),
          cid: normalizedCid,
          deathtext: normalizeText(deathtext),
          icd10: normalizeText(icd10),
          braincardiac,
          potential,
          chkpotential,
          commentnonchk,
          wardtotc,
          negotiate,
          negotiate_succ,
          commentnonnego,
          geteye,
          eyetotal,
          commentnoget,
          negotiate_staff,
          geteye_staff,
          geteye_place: normalizeText(geteye_place),
          firststaff: firststaffValue,
          fristtime: fristtimeValue,
          status: body.status !== undefined ? Number(body.status) : 1,
          is_complete: isCompleteValue,
        },
        { transaction }
      );

      await transaction.commit();

      const { createdAt, updatedAt, ...cleanData } = donorData.toJSON ? donorData.toJSON() : donorData;
      return cleanData;
    } catch (error: any) {
      await transaction.rollback();
      throw error;
    }
  }
}
