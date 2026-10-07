import db from "../../models/eyes-donation";
import dbPPK from "../../models/ppkhosp";


export class CreateDonationService {
  static async createDonorConsent(body: any) {
    const transaction = await db.sequelize.transaction();
    try {
      const {
        hn,
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
        firststaff,
        firsttime,
        fristtime,
      } = body;

      // ตรวจสอบฟิลด์บังคับ
      const fieldRequest = ["hn"];
      fieldRequest.forEach((item) => {
        if (!body[item]) {
          throw new Error(`${item} is required`);
        }
      });

      // 1. ตรวจสอบว่าข้อมูลมีอยู่แล้วในระบบหรือไม่ (ก่อนบันทึก)
      const checkWhere: any = { hn };
      const check = await db.DonorCase.findOne({
        where: checkWhere,
        transaction,
      });

      if (check) {
        throw new Error("Data already exists (มีข้อมูลผู้ป่วยรายนี้เเล้ว)");
      }

      // 2. ตรวจสอบคนไข้ในระบบ PPK
      const pat = await dbPPK.PatDead.findOne({
        where: { hn },
        attributes: ["hn"],
      });

      if (!pat) {
        throw new Error("Data not found (ไม่พบข้อมูลคนไข้ในระบบ ppkhosp)");
      }

      // จัดการกรณีส่ง firsttime หรือ fristtime มา (ถ้าส่งค่าว่างหรือไม่ได้ส่ง ให้เป็น null)
      let fristtimeValue = firsttime !== undefined ? firsttime : fristtime;
      if (!fristtimeValue || fristtimeValue === "") {
        fristtimeValue = null;
      }

      // 3. บันทึกข้อมูลลง Database
      const donorData = await db.DonorCase.create(
        {
          hn,
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
          firststaff: firststaff || "-",
          fristtime: fristtimeValue,
          status: body.status !== undefined ? Number(body.status) : 1,
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
