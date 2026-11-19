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
    const caseData = await db.DonorCase.findByPk(donorCaseId, {
      include: [
        { model: db.Option, as: "Braincardiac" },
        { model: db.Option, as: "Potential" },
        { model: db.Option, as: "Wardtotc" },
        { model: db.Option, as: "Negotiate" },
        { model: db.Option, as: "Chkpotential" },
        { model: db.Option, as: "NegotiateSucc" },
        { model: db.Option, as: "Geteye" },
        { model: db.Option, as: "Eyetotal" },
      ],
    });
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

    const hospitalCode = process.env.HOSPITAL_CODE || "10664";
    const hospitalName = process.env.HOSPITAL_NAME || "โรงพยาบาลปกเกล้า";
    const hospitalHpt = Number(process.env.HOSPITAL_HPT || process.env.HOSPITAL_CODE || 10664);
    const regionId = Number(process.env.REGION_ID || 6);
    const regionName = process.env.REGION_NAME || "เขตสุขภาพ ที่ 6";
    const chwpart = Number(process.env.CHWPART || 10);
    const chwpartName = process.env.CHWPART_NAME || "จันทบุรี";

    // ฟังก์ชันจัดรูปแบบ firsttime เป็น YYYY-MM-DDTHH:mm:ss ตามตัวอย่าง API MOPH
    const formatFirstTime = (val: any) => {
      if (!val) return null;
      const d = new Date(val);
      if (isNaN(d.getTime())) return typeof val === "string" ? val : null;
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    // จัดเตรียม Payload ตามตัวอย่าง Request JSON ของ MOPH Eye Donations API (หน้า 4-5)
    const payload = {
      cid: patientInfo.cid ? String(patientInfo.cid) : null,
      hospital_code: hospitalCode,
      hospital_name: hospitalName,
      pkpt: patientInfo.pkpt || `${rawCase.hn}${hospitalCode}`,
      braincardiac: rawCase.Braincardiac?.value ?? (rawCase.braincardiac === 1 ? 1 : rawCase.braincardiac === 2 ? 2 : null),
      hn: String(rawCase.hn),
      an: patientInfo.an ? String(patientInfo.an) : null,
      fullname: patientInfo.fullname || null,
      male: patientInfo.male || null,
      ward: patientInfo.wardname || (patientInfo.ward ? String(patientInfo.ward) : null),
      dchdate: patientInfo.dchdate || null,
      age: patientInfo.age !== undefined && patientInfo.age !== null ? Number(patientInfo.age) : null,
      deathtext: patientInfo.deathtext || null,
      icd10: patientInfo.icd10 || null,
      potential: rawCase.Potential?.value ?? (rawCase.potential === 3 ? 1 : rawCase.potential === 4 ? 2 : rawCase.potential ? Number(rawCase.potential) : null),
      wardtotc: rawCase.Wardtotc?.value ?? (rawCase.wardtotc === 7 ? 1 : rawCase.wardtotc === 8 ? 2 : rawCase.wardtotc ? Number(rawCase.wardtotc) : null),
      negotiate: rawCase.Negotiate?.value ?? (rawCase.negotiate === 9 ? 1 : rawCase.negotiate === 10 ? 2 : rawCase.negotiate ? Number(rawCase.negotiate) : null),
      chkpotential: rawCase.Chkpotential?.value ?? (rawCase.chkpotential === 5 ? 1 : rawCase.chkpotential === 6 ? 2 : rawCase.chkpotential ? Number(rawCase.chkpotential) : null),
      commentnonchk: rawCase.commentnonchk || null,
      negotiate_succ: rawCase.NegotiateSucc?.value ?? (rawCase.negotiate_succ === 11 ? 1 : rawCase.negotiate_succ === 12 ? 2 : rawCase.negotiate_succ !== undefined && rawCase.negotiate_succ !== null ? Number(rawCase.negotiate_succ) : null),
      commentnonnego: rawCase.commentnonnego || null,
      geteye: rawCase.Geteye?.value ?? (rawCase.geteye === 13 ? 1 : rawCase.geteye === 14 ? 2 : rawCase.geteye !== undefined && rawCase.geteye !== null ? Number(rawCase.geteye) : null),
      eyetotal: rawCase.Eyetotal?.value ?? (rawCase.eyetotal === 15 ? 0 : rawCase.eyetotal === 16 ? 1 : rawCase.eyetotal === 17 ? 2 : rawCase.eyetotal !== undefined && rawCase.eyetotal !== null ? Number(rawCase.eyetotal) : null),
      commentnoget: rawCase.commentnoget || null,
      negotiate_staff: rawCase.negotiate_staff || null,
      geteye_staff: rawCase.geteye_staff || null,
      firststaff: rawCase.firststaff || "-",
      firsttime: formatFirstTime(rawCase.firsttime || rawCase.fristtime),
      region_id: regionId,
      region_name: regionName,
      deathtext_id: patientInfo.deathtext_id !== undefined && patientInfo.deathtext_id !== null ? Number(patientInfo.deathtext_id) : 2,
      chwpart: chwpart,
      chwpart_name: chwpartName,
    };

    const missingFields = CompletenessHelper.getMissingFields(rawCase);

    // ตรวจสอบฟิลด์บังคับของผู้ป่วยจาก PPK
    if (!patientInfo.cid) missingFields.push("เลขบัตรประชาชนผู้ป่วย (CID ใน PPK)");
    if (!patientInfo.fullname) missingFields.push("ชื่อ-นามสกุลผู้ป่วย (ใน PPK)");
    if (!patientInfo.dchdate) missingFields.push("วันที่เสียชีวิต (dchdate ใน PPK)");
    if (!patientInfo.dchtime) missingFields.push("เวลาเสียชีวิต (dchtime ใน PPK)");
    if (patientInfo.ward === undefined || patientInfo.ward === null) missingFields.push("หอผู้ป่วย (ward ใน PPK)");

    const isComplete = missingFields.length === 0 ? 1 : 0;

    return {
      donorCase: rawCase,
      payload,
      is_complete: isComplete,
      missing_fields: missingFields,
    };
  }

  /**
   * ส่งข้อมูลเคสบริจาคดวงตาไปยังระบบ MOPH 
   * ยิงเฉพาะก้อน payload (JSON 33 ฟิลด์) ไปยัง MOPH โดยตรง
   * เมื่อส่งสำเร็จจะปรับ status = 2
   */
  static async sendDonorCaseToMoph(donorCaseId: number, userToken?: string, customPayload?: any) {
    let payloadToSend: any = null;

    // ถ้ามีการส่ง custom payload มา ให้ใช้ตัวนั้น ยิงตรงได้เลย
    if (customPayload && typeof customPayload === "object" && Object.keys(customPayload).length > 0) {
      payloadToSend = customPayload;
    } else {
      const { payload } = await this.preparePayload(donorCaseId);
      payloadToSend = payload;
    }

    const mophApiUrl = process.env.MOPH_API_URL;

    if (!mophApiUrl) {
      throw new Error("MOPH API URL is not defined (กรุณากำหนด MOPH_API_URL ใน .env)");
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
        body: JSON.stringify(payloadToSend),
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
      sent_payload: payloadToSend,
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
