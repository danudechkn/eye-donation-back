import db from "../../models/eyes-donation";
import { SearchPatService } from "../pat/serchPat.service";
import { CompletenessHelper } from "../../utils/completeness.helper";
import dotenv from "dotenv";

dotenv.config();

export class MophEyeDonationService {
  /**
   * ดึงข้อมูลเคสและคนไข้เพื่อประกอบเป็น Payload ส่ง MOPH
   */
  static async preparePayload(donorCaseId: number) {
    const caseData = await db.DonorCase.findByPk(donorCaseId);
    if (!caseData) {
      throw new Error("Data not found (ไม่พบข้อมูลเคสบริจาคดวงตา)");
    }

    const rawCase: any = caseData.toJSON ? caseData.toJSON() : caseData;

    let patientInfo: any = {};
    try {
      const patResults = await SearchPatService.searchPat(rawCase.hn);
      if (patResults && patResults.length > 0) {
        patientInfo = patResults[0];
      }
    } catch (err: any) {
      console.warn("Could not fetch PPK patient info:", err.message);
    }

    const hospitalCode = process.env.HOSPITAL_CODE;
    const hospitalName = process.env.HOSPITAL_NAME;
    const regionId = Number(process.env.REGION_ID);
    const regionName = process.env.REGION_NAME;
    const chwpart = Number(process.env.CHWPART);
    const chwpartName = process.env.CHWPART_NAME;

    // จัดเตรียม Payload ตามโครงสร้าง MOPH Eye Donations API (เรียงตาม field spec)
    const payload = {
      cid: patientInfo.cid || null,
      hospital_code: hospitalCode,
      hospital_name: hospitalName,
      pkpt: patientInfo.pkpt || `${rawCase.hn}${hospitalCode}`,
      braincardiac: rawCase.braincardiac,
      hn: rawCase.hn,
      an: patientInfo.an || null,
      fullname: patientInfo.fullname || null,
      male: patientInfo.male || null,
      ward: patientInfo.ward || null,
      dchdate: patientInfo.dchdate || null,
      age: patientInfo.age !== undefined ? patientInfo.age : null,
      deathtext: patientInfo.deathtext || null,
      icd10: patientInfo.icd10 || null,
      potential: rawCase.potential,
      wardtotc: rawCase.wardtotc,
      negotiate: rawCase.negotiate,
      chkpotential: rawCase.chkpotential,
      commentnonchk: rawCase.commentnonchk || null,
      negotiate_succ: rawCase.negotiate_succ !== undefined ? rawCase.negotiate_succ : null,
      commentnonnego: rawCase.commentnonnego || null,
      geteye: rawCase.geteye,
      eyetotal: rawCase.eyetotal,
      commentnoget: rawCase.commentnoget || null,
      negotiate_staff: rawCase.negotiate_staff || null,
      geteye_staff: rawCase.geteye_staff || null,
      firststaff: rawCase.firststaff || "-",
      firsttime: rawCase.firsttime || null,
      region_id: regionId,
      region_name: regionName,
      deathtext_id: patientInfo.deathtext_id || null,
      chwpart: chwpart,
      chwpart_name: chwpartName,
    };

    const missingFields = CompletenessHelper.getMissingFields(rawCase);
    const isComplete = rawCase.is_complete !== undefined && rawCase.is_complete !== null
      ? Number(rawCase.is_complete)
      : (missingFields.length === 0 ? 1 : 0);

    return {
      donorCase: rawCase,
      payload,
      is_complete: isComplete,
      missing_fields: missingFields,
    };
  }

  /**
   * ส่งข้อมูลเคสบริจาคดวงตาไปยังระบบ MOPH 
   * เมื่อส่งสำเร็จจะปรับ status = 2
   */
  static async sendDonorCaseToMoph(donorCaseId: number, userToken?: string) {
    const { donorCase, payload, is_complete, missing_fields } = await this.preparePayload(donorCaseId);

    // 🔒 ตรวจสอบความครบถ้วนของข้อมูล หากไม่ครบจะไม่ให้ส่ง
    if (is_complete !== 1 || (missing_fields && missing_fields.length > 0)) {
      const missingText = missing_fields && missing_fields.length > 0
        ? ` (ยังขาด: ${missing_fields.join(", ")})`
        : "";
      throw new Error(`ข้อมูลเคสบริจาคยังไม่ครบถ้วน ไม่สามารถส่งไปยังระบบ MOPH ได้${missingText}`);
    }

    const mophApiUrl = process.env.MOPH_API_URL;

    if (!mophApiUrl) {
      throw new Error("MOPH API URL is not defined");
    }

    // จัดการ Authorization Token (เลือกจาก Header ผู้ใช้ หรือ Token กลางใน .env)
    const token = userToken || process.env.MOPH_API_TOKEN;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    if (token) {
      headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }

    let mophResponseData: any = null;

    try {
      const response = await fetch(mophApiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      try {
        mophResponseData = JSON.parse(responseText);
      } catch {
        mophResponseData = { raw: responseText };
      }

      if (!response.ok) {
        const errorMsg =
          mophResponseData?.message ||
          mophResponseData?.error ||
          `MOPH API returned status ${response.status} (${response.statusText})`;
        throw new Error(errorMsg);
      }
    } catch (fetchError: any) {
      throw new Error(`ส่งข้อมูลไป MOPH ไม่สำเร็จ: ${fetchError.message}`);
    }

    // เมื่อส่งข้อมูลสำเร็จ ปรับสถานะเป็น 2 (ส่งแล้ว)
    await db.DonorCase.update(
      { status: 2 },
      { where: { id: donorCaseId } }
    );

    return {
      status: "success",
      message: "ส่งข้อมูลไปยังระบบ MOPH สำเร็จ",
      data: mophResponseData,
    };
  }

  /**
   * รีเซ็ตสถานะกลับเป็น 1 (ยังไม่ส่ง) สำหรับการทดสอบ
   */
  static async resetMophStatus(donorCaseId: number) {
    const caseData = await db.DonorCase.findByPk(donorCaseId);
    if (!caseData) {
      throw new Error("Data not found (ไม่พบข้อมูลเคสบริจาคดวงตา)");
    }

    await db.DonorCase.update(
      { status: 1 },
      { where: { id: donorCaseId } }
    );

    return {
      id: donorCaseId,
      status: 1,
      message: "รีเซ็ตสถานะกลับเป็น 1 (ยังไม่ส่ง) เรียบร้อยแล้ว",
    };
  }
}

export default MophEyeDonationService;
