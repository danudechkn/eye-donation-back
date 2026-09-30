import db from "../../models/eyes-donation";

export class DeleteDonationService {
    static async deleteDonorConsent(id: number) {
        const transaction = await db.sequelize.transaction();
        try {
            const existingData = await db.DonorCase.findByPk(id, { transaction });
            if (!existingData) {
                throw new Error("Data not found (ไม่พบข้อมูลที่ต้องการลบ)");
            }

            await existingData.destroy({ transaction });

            await transaction.commit();

            return { message: "Delete success" };
        } catch (error: any) {
            if (transaction) await transaction.rollback();
            throw error;
        }
    }
}