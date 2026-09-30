import db from "../../models/eyes-donation";


export class UpdateDonationService {
    static async updateDonorConsent(id: number, body: any) {
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

            let fristtimeValue: string | Date | null | undefined = firsttime !== undefined ? firsttime : fristtime;
            if (fristtimeValue === "") {
                fristtimeValue = null;
            }

            // 1. หาข้อมูลเดิมก่อน
            const existingData = await db.DonorCase.findByPk(id, { transaction });
            if (!existingData) {
                throw new Error("Data not found (ไม่พบข้อมูลที่ต้องการอัปเดต)");
            }

            // 2. ทำการ Update ข้อมูล
            await existingData.update(
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
                    firststaff,
                    fristtime: fristtimeValue,
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
