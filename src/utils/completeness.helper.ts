/**
 * Helper สำหรับตรวจสอบความครบถ้วนสมบูรณ์ของข้อมูลเคสบริจาคดวงตา
 */
export class CompletenessHelper {
  /**
   * คืนรายการฟิลด์ที่ยังกรอกไม่ครบถ้วน
   */
  static getMissingFields(data: any): string[] {
    const missing: string[] = [];

    if (!data.hn) missing.push("HN ผู้ป่วย");
    if (data.braincardiac === undefined || data.braincardiac === null) missing.push("ประเภทการเสียชีวิต (Brain Death / Cardiac Death)");
    if (data.potential === undefined || data.potential === null) missing.push("การประเมินศักยภาพ");
    if (data.chkpotential === undefined || data.chkpotential === null) missing.push("ผลการตรวจสอบศักยภาพ");
    if (data.wardtotc === undefined || data.wardtotc === null) missing.push("สถานะการแจ้ง TC");
    if (data.negotiate === undefined || data.negotiate === null) missing.push("สถานะการเจรจา");

    // ตรวจสอบเงื่อนไขการเจรจา
    if (Number(data.negotiate) === 1) {
      if (data.negotiate_succ === undefined || data.negotiate_succ === null) {
        missing.push("ผลการเจรจาขอรับบริจาค");
      }
      if (!data.negotiate_staff || String(data.negotiate_staff).trim() === "") {
        missing.push("เจ้าหน้าที่ผู้เจรจา");
      }

      // หากเจรจาสำเร็จ (1)
      if (Number(data.negotiate_succ) === 1) {
        if (data.geteye === undefined || data.geteye === null) {
          missing.push("สถานะการจัดเก็บดวงตา");
        } else if (Number(data.geteye) === 1) {
          // จัดเก็บได้
          if (data.eyetotal === undefined || data.eyetotal === null || Number(data.eyetotal) <= 0) {
            missing.push("จำนวนดวงตาที่จัดเก็บได้");
          }
          if (!data.geteye_staff || String(data.geteye_staff).trim() === "") {
            missing.push("แพทย์/เจ้าหน้าที่ผู้จัดเก็บดวงตา");
          }
        } else if (Number(data.geteye) === 2) {
          // จัดเก็บไม่ได้
          if (!data.commentnoget || String(data.commentnoget).trim() === "") {
            missing.push("เหตุผลที่จัดเก็บดวงตาไม่ได้");
          }
        }
      } else if (Number(data.negotiate_succ) === 2) {
        // เจรจาไม่สำเร็จ
        if (!data.commentnonnego || String(data.commentnonnego).trim() === "") {
          missing.push("เหตุผลที่ไม่ยินยอมบริจาค");
        }
      }
    } else if (Number(data.negotiate) === 2) {
      // ไม่ได้เจรจา
      if (!data.commentnonnego || String(data.commentnonnego).trim() === "") {
        missing.push("เหตุผลที่ไม่ได้เจรจา");
      }
    }

    // ตรวจสอบผู้บันทึกและวันเวลา
    if (!data.firststaff || String(data.firststaff).trim() === "" || String(data.firststaff).trim() === "-") {
      missing.push("เจ้าหน้าที่ผู้บันทึกข้อมูล");
    }

    const timeValue = data.firsttime || data.fristtime;
    if (!timeValue) {
      missing.push("วันเวลาที่บันทึกเคส");
    }

    return missing;
  }

  /**
   * คำนวณค่า is_complete (1 = ครบถ้วน, 0 = ไม่ครบถ้วน)
   * หากมีการระบุ body.is_complete มา ให้ใช้ค่านั้นเป็นหลัก
   */
  static calculateCompleteness(data: any): number {
    if (data.is_complete !== undefined && data.is_complete !== null) {
      return Number(data.is_complete) === 1 || data.is_complete === true ? 1 : 0;
    }
    const missing = this.getMissingFields(data);
    return missing.length === 0 ? 1 : 0;
  }
}
