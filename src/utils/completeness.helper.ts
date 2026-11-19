/**
 * Helper สำหรับตรวจสอบความครบถ้วนสมบูรณ์ของข้อมูลเคสบริจาคดวงตา
 */
export class CompletenessHelper {
  /**
   * แปลง Option ID หรือ Object ให้เป็น Value มาตรฐาน (1, 2, 0)
   */
  private static resolveValue(optionObj: any, rawVal: any, type: string): number | null {
    if (optionObj && optionObj.value !== undefined && optionObj.value !== null) {
      return Number(optionObj.value);
    }
    if (rawVal === undefined || rawVal === null || rawVal === "") {
      return null;
    }
    const n = Number(rawVal);
    if (isNaN(n)) return null;

    // แปลง Option ID ไปเป็น value ที่แท้จริงตามตาราง options
    if (type === "negotiate") {
      if (n === 9) return 1;  // เจรจาแล้ว
      if (n === 10) return 2; // ไม่ได้เจรจา
    }
    if (type === "negotiate_succ") {
      if (n === 11) return 1; // สำเร็จ
      if (n === 12) return 2; // ไม่สำเร็จ
    }
    if (type === "geteye") {
      if (n === 13) return 1; // จัดเก็บได้
      if (n === 14) return 2; // จัดเก็บไม่ได้
    }
    if (type === "eyetotal") {
      if (n === 15) return 0; // ไม่ได้
      if (n === 16) return 1; // 1 ดวง
      if (n === 17) return 2; // 2 ดวง
    }
    if (type === "chkpotential") {
      if (n === 5) return 1;  // Evaluated
      if (n === 6) return 2;  // Not Evaluated
    }
    if (type === "potential") {
      if (n === 3) return 1;  // Yes
      if (n === 4) return 2;  // No
    }
    if (type === "wardtotc") {
      if (n === 7) return 1;  // แจ้ง TC แล้ว
      if (n === 8) return 2;  // ไม่ได้แจ้ง
    }
    if (type === "braincardiac") {
      if (n === 1) return 1;  // Brain Death
      if (n === 2) return 2;  // Cardiac Death
    }
    return n;
  }

  /**
   * คืนรายการฟิลด์ที่ยังกรอกไม่ครบถ้วน
   */
  static getMissingFields(data: any): string[] {
    const missing: string[] = [];

    if (!data.hn) missing.push("HN ผู้ป่วย");

    const braincardiacVal = this.resolveValue(data.Braincardiac, data.braincardiac, "braincardiac");
    if (braincardiacVal === null) {
      missing.push("ประเภทการเสียชีวิต (Brain Death / Cardiac Death)");
    }

    const potentialVal = this.resolveValue(data.Potential, data.potential, "potential");
    if (potentialVal === null) {
      missing.push("การประเมินศักยภาพ (potential)");
    }

    const chkpotentialVal = this.resolveValue(data.Chkpotential, data.chkpotential, "chkpotential");
    if (chkpotentialVal === null) {
      missing.push("ผลการตรวจสอบศักยภาพ (chkpotential)");
    } else if (chkpotentialVal === 2) {
      if (!data.commentnonchk || String(data.commentnonchk).trim() === "") {
        missing.push("เหตุผลที่ไม่ได้ประเมินศักยภาพ (commentnonchk)");
      }
    }

    const wardtotcVal = this.resolveValue(data.Wardtotc, data.wardtotc, "wardtotc");
    if (wardtotcVal === null) {
      missing.push("สถานะการแจ้ง TC (wardtotc)");
    }

    const negotiateVal = this.resolveValue(data.Negotiate, data.negotiate, "negotiate");
    const negotiateSuccVal = this.resolveValue(data.NegotiateSucc, data.negotiate_succ, "negotiate_succ");
    const geteyeVal = this.resolveValue(data.Geteye, data.geteye, "geteye");
    const eyetotalVal = this.resolveValue(data.Eyetotal, data.eyetotal, "eyetotal");

    if (negotiateVal === null) {
      missing.push("สถานะการเจรจา (negotiate)");
    } else if (negotiateVal === 1) {
      // มีการเจรจา
      if (negotiateSuccVal === null) {
        missing.push("ผลการเจรจาขอรับบริจาค (negotiate_succ)");
      }
      if (!data.negotiate_staff || String(data.negotiate_staff).trim() === "") {
        missing.push("เจ้าหน้าที่ผู้เจรจา (negotiate_staff)");
      }

      // หากเจรจาสำเร็จ (1)
      if (negotiateSuccVal === 1) {
        if (geteyeVal === null) {
          missing.push("สถานะการจัดเก็บดวงตา (geteye)");
        } else if (geteyeVal === 1) {
          // จัดเก็บได้
          if (eyetotalVal === null || eyetotalVal <= 0) {
            missing.push("จำนวนดวงตาที่จัดเก็บได้ (eyetotal)");
          }
          if (!data.geteye_staff || String(data.geteye_staff).trim() === "") {
            missing.push("แพทย์/เจ้าหน้าที่ผู้จัดเก็บดวงตา (geteye_staff)");
          }
        } else if (geteyeVal === 2) {
          // จัดเก็บไม่ได้
          if (!data.commentnoget || String(data.commentnoget).trim() === "") {
            missing.push("เหตุผลที่จัดเก็บดวงตาไม่ได้ (commentnoget)");
          }
        }
      } else if (negotiateSuccVal === 2) {
        // เจรจาไม่สำเร็จ
        if (!data.commentnonnego || String(data.commentnonnego).trim() === "") {
          missing.push("เหตุผลที่ไม่ยินยอมบริจาค (commentnonnego)");
        }
      }
    } else if (negotiateVal === 2) {
      // ไม่ได้เจรจา
      if (!data.commentnonnego || String(data.commentnonnego).trim() === "") {
        missing.push("เหตุผลที่ไม่ได้เจรจา (commentnonnego)");
      }
    }

    // ตรวจสอบผู้บันทึกและวันเวลา
    if (!data.firststaff || String(data.firststaff).trim() === "" || String(data.firststaff).trim() === "-") {
      missing.push("เจ้าหน้าที่ผู้บันทึกข้อมูล (firststaff)");
    }

    const timeValue = data.firsttime || data.fristtime;
    if (!timeValue) {
      missing.push("วันเวลาที่บันทึกเคส (firsttime)");
    }

    return missing;
  }

  /**
   * คำนวณค่า is_complete (1 = ครบถ้วน, 0 = ไม่ครบถ้วน)
   * ประเมินจากฟิลด์ที่กรอกจริงเสมอ
   */
  static calculateCompleteness(data: any): number {
    const missing = this.getMissingFields(data);
    return missing.length === 0 ? 1 : 0;
  }
}

