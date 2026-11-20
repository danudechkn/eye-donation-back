import db from "../../models/eyes-donation";
import { CompletenessHelper } from "../../utils/completeness.helper";


export class UpdateDonationService {
    static async updateDonorConsent(id: number, body: any) {
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

            const normalizeText = (val: unknown): string | null | undefined => {
                if (val === undefined) return undefined;
                if (val === null) return null;
                const trimmed = String(val).trim();
                return trimmed === "" ? null : trimmed;
            };

            const normalizedCid = normalizeText(cid);
            if (normalizedCid !== undefined && normalizedCid !== null && !/^\d{13}$/.test(normalizedCid)) {
                throw new Error("เลขบัตรประชาชน (CID) ต้องเป็นตัวเลขครบ 13 หลัก");
            }

            let fristtimeValue: string | Date | null | undefined = firsttime !== undefined ? firsttime : fristtime;
            if (fristtimeValue === "") {
                fristtimeValue = null;
            }

            // 1. หาข้อมูลเดิมก่อน
            const existingData = await db.DonorCase.findByPk(id, { transaction });
            if (!existingData) {
                throw new Error("Data not found (ไม่พบข้อมูลที่ต้องการอัปเดต)");
            }

            // รวมข้อมูลเดิมและข้อมูลใหม่เพื่อประเมินความครบถ้วน (ล็อก firststaff ใช้ค่าเดิมเสมอ)
            const mergedData = {
                ...existingData.toJSON(),
                ...body,
                firststaff: existingData.firststaff,
                fristtime: fristtimeValue !== undefined ? fristtimeValue : existingData.fristtime,
            };
            const isCompleteValue = CompletenessHelper.calculateCompleteness(mergedData);

            // 2. ทำการ Update ข้อมูล (ไม่อนุญาตให้แก้ไข firststaff)
            await existingData.update(
                {
                    hn,
                    ...(fullname !== undefined ? { fullname: normalizeText(fullname) } : {}),
                    ...(cid !== undefined ? { cid: normalizedCid } : {}),
                    ...(deathtext !== undefined ? { deathtext: normalizeText(deathtext) } : {}),
                    ...(icd10 !== undefined ? { icd10: normalizeText(icd10) } : {}),
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
                    ...(geteye_place !== undefined ? { geteye_place: normalizeText(geteye_place) } : {}),
                    fristtime: fristtimeValue,
                    is_complete: isCompleteValue,
                    ...(body.status !== undefined ? { status: Number(body.status) } : {}),
                },
                { transaction }
            );

            await transaction.commit();

            return { message: "Update success" };
        } catch (error: any) {
            if (transaction) await transaction.rollback();
            throw error;
        }
    }
}
