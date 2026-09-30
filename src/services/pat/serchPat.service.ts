import dbPPK from "../../models/ppkhosp";
import { Sequelize } from "sequelize";
import { DateHelper } from "./helpers/date.helper";

export class SearchPatService {
  public static async searchPat(hn: string) {
    if (!hn) {
      throw new Error("hn is required for fetching deceased patients");
    }
    const patDeadRecord = await dbPPK.PatDead.findOne({
      where: { hn },
      include: [
        {
          model: dbPPK.Pat,
          as: "patient",
          required: false,
        },
        {
          model: dbPPK.PatAdmit,
          as: "admission",
          required: false,
          include: [
            {
              model: dbPPK.Location,
              as: "dischLocation",
              required: false,
            },
            {
              model: dbPPK.Location,
              as: "toLocation",
              required: false,
            },
          ],
        },
      ],
      order: [
        [Sequelize.literal("IFNULL(`admission`.`dischargedate`, `PatDead`.`editdatetime`)"), "DESC"]
      ],
      raw: true,
      nest: true,
    });

    if (!patDeadRecord) {
      return [];
    }

    const pd: any = patDeadRecord;
    const p = pd.patient || {};
    const pa = pd.admission || {};

    // คำนวณตึก/สถานที่แบบเดียวกับ IFNULL(pa.dischlocationid, pa.tolocationid)
    const loc = pa.dischlocationid ? pa.dischLocation : pa.toLocation;

    const dchdateInput = pa.dischargedate || pd.editdatetime;
    const dchtimeInput = pa.dischargedatetime || pd.editdatetime;

    const age = DateHelper.calculateAge(p.birthdatetime, dchdateInput);

    const dchdateStr = DateHelper.formatDate(dchdateInput)?.replace(/-/g, '') || '';
    const pkpt = `${dchdateStr}${pd.hn}10664`;

    // Map ข้อมูลให้ตรงกับ Schema เดิม (SQL) ที่เคยเขียนไว้
    const result = {
      pkpt: pkpt,
      cid: p.citizencardno || null,
      hn: pd.hn,
      an: pa.an || '',
      fullname: `${p.prename || ''}${p.firstname || ''} ${p.lastname || ''}`.trim(),
      male: p.sex === 1 ? 'ชาย' : p.sex === 2 ? 'หญิง' : 'ไม่ระบุ',
      ward: loc?.id || null,
      wardname: loc?.detailtext || null,
      dchdate: DateHelper.formatDate(dchdateInput),
      dchtime: DateHelper.formatTime(dchtimeInput),
      age: age,
      deathtext: pd.diagdetail || null,
      icd10: pd.icdcode || null,
    };

    return [result];
  }
}
