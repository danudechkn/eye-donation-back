import { SearchPatService } from "../pat/serchPat.service";
import { Op } from "sequelize";
import db from "../../models/eyes-donation";
import dbPPK from "../../models/ppkhosp";
import { DateHelper } from "../pat/helpers/date.helper";

export class DonationIndexService {
    static async index(query: any) {
        const { search } = query;
        const limit = Number(query.limit) || 10;
        const page = Number(query.page) || 1;
        const offset = (page - 1) * limit;

        let matchedHnsFromPat: string[] = [];
        if (search) {
            const trimmedSearch = String(search).trim();
            const searchParts = trimmedSearch.split(/\s+/);

            const patWhereConditions: any[] = [
                { hn: { [Op.like]: `%${trimmedSearch}%` } },
                { firstname: { [Op.like]: `%${trimmedSearch}%` } },
                { lastname: { [Op.like]: `%${trimmedSearch}%` } },
                { citizencardno: { [Op.like]: `%${trimmedSearch}%` } },
            ];

            if (searchParts.length > 1) {
                patWhereConditions.push({
                    [Op.and]: [
                        { firstname: { [Op.like]: `%${searchParts[0]}%` } },
                        { lastname: { [Op.like]: `%${searchParts[1]}%` } },
                    ],
                });
            }

            const matchingPats = await dbPPK.Pat.findAll({
                where: {
                    [Op.or]: patWhereConditions,
                },
                attributes: ["hn"],
                raw: true,
            });

            matchedHnsFromPat = matchingPats.map((p: any) => String(p.hn));
        }

        const where: any = {};

        // if (braincardiac) where.braincardiac = braincardiac;
        // if (potential) where.potential = potential;
        // if (chkpotential) where.chkpotential = chkpotential;
        // if (geteye) where.geteye = geteye;

        // if (startDate && endDate) {
        //   where.createdAt = {
        //     [Op.between]: [new Date(`${startDate} 00:00:00`), new Date(`${endDate} 23:59:59`)],
        //   };
        // } else if (startDate) {
        //   where.createdAt = {
        //     [Op.gte]: new Date(`${startDate} 00:00:00`),
        //   };
        // } else if (endDate) {
        //   where.createdAt = {
        //     [Op.lte]: new Date(`${endDate} 23:59:59`),
        //   };
        // }

        if (search) {
            const trimmedSearch = String(search).trim();
            const searchConditions: any[] = [
                { hn: { [Op.like]: `%${trimmedSearch}%` } },
                { firststaff: { [Op.like]: `%${trimmedSearch}%` } },
                { negotiate_staff: { [Op.like]: `%${trimmedSearch}%` } },
                { geteye_staff: { [Op.like]: `%${trimmedSearch}%` } },
            ];

            if (matchedHnsFromPat.length > 0) {
                searchConditions.push({ hn: matchedHnsFromPat });
            }

            where[Op.or] = searchConditions;
        }

        // 1. ดึงข้อมูลจากฐานข้อมูล donor_cases
        const { count: total, rows: dataForm } = await db.DonorCase.findAndCountAll({
            where,
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        });

        // ถ้าไม่มีข้อมูล ให้ return array ว่าง
        if (dataForm.length === 0) {
            return {
                data: [],
                pagination: {
                    total: 0,
                    page,
                    limit,
                    offset,
                },
            };
        }

        // ดึงเฉพาะ hn ออกมาเพื่อไปหาข้อมูลคนไข้ใน PPK
        const patientHns = dataForm.map((item: any) => item.hn);

        // 2. ดึงข้อมูลผู้ป่วยและข้อมูลการเสียชีวิตจาก PPK ขนานกันแบบ Parallel เพื่อความเร็วสูงสุด
        const [patDeadRecords, patRecords] = await Promise.all([
            dbPPK.PatDead.findAll({
                where: { hn: patientHns },
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
                        attributes: ["an", "dischargedate"],
                    },
                ],
                raw: true,
                nest: true,
            }),
            dbPPK.Pat.findAll({
                where: { hn: patientHns },
                attributes: [
                    "hn",
                    "prename",
                    "firstname",
                    "lastname",
                    "citizencardno",
                ],
                raw: true,
            }),
        ]);

        // 3. นำ dataForm มา loop เพื่อประกอบข้อมูลกับ HIS ให้ครบถ้วน
        const result = dataForm.map((form: any) => {
            const rawForm = form.toJSON ? form.toJSON() : form;
            const deadInfo: any = patDeadRecords.find((pd: any) => String(pd.hn) === String(rawForm.hn)) || {};
            const patientInfo: any = deadInfo.patient || patRecords.find((p: any) => String(p.hn) === String(rawForm.hn)) || {};

            const fullname = patientInfo.firstname
                ? `${patientInfo.prename || ''}${patientInfo.firstname} ${patientInfo.lastname || ''}`.trim()
                : "ไม่พบข้อมูลชื่อ";

            return {
                ...rawForm,
                hn: rawForm.hn || null,
                fullname,
                cid: patientInfo.citizencardno || null,
                deathtext: deadInfo.diagdetail || null,
            };
        });

        return {
            data: result,
            pagination: {
                total,
                page,
                limit,
                offset,
            },
        };
    }

    static async getById(id: number) {
        const caseData = await db.DonorCase.findByPk(id);
        if (!caseData) {
            throw new Error("Data not found");
        }
        const rawCase = caseData.toJSON ? caseData.toJSON() : caseData;
        const { createdAt, updatedAt, ...cleanCase } = rawCase;

        let patientInfo: any = {};
        try {
            const patResults = await SearchPatService.searchPat(cleanCase.hn);
            if (patResults && patResults.length > 0) {
                patientInfo = patResults[0];
            }
        } catch (e) {
            // fallback
        }

        return {
            ...cleanCase,
            fullname: patientInfo.fullname || null,
            cid: patientInfo.cid || null,
            deathtext: patientInfo.deathtext || null,
            icd10: patientInfo.icd10 || null,
        };
    }
    static async getStatistics(query?: { startDate?: string; endDate?: string }) {
        const where: any = {};

        // รองรับการ filter ช่วงวันที่ (ถ้ามีการส่ง query มา เช่น ดูสถิติเฉพาะปี/เดือนนี้)
        if (query?.startDate && query?.endDate) {
            where.createdAt = {
                [Op.between]: [new Date(`${query.startDate} 00:00:00`), new Date(`${query.endDate} 23:59:59`)],
            };
        }

        const allCases = await db.DonorCase.findAll({
            where,
            order: [["createdAt", "ASC"]],
        });

        // Helper functions รองรับทั้ง options.id จาก seeder และ options.value ปกติ
        const isPotential = (c: any) => c.potential === 1 || c.potential === 3; // 3 คือ Yes
        const isEvaluated = (c: any) => c.chkpotential === 1 || c.chkpotential === 5; // 5 คือ Evaluated
        const isWardToTc = (c: any) => c.wardtotc === 1 || c.wardtotc === 7; // 7 คือ แจ้ง TC แล้ว
        const isNegotiateSucc = (c: any) => c.negotiate_succ === 1 || c.negotiate_succ === 11; // 11 คือ สำเร็จ
        const isNegotiateFail = (c: any) => c.negotiate_succ === 2 || c.negotiate_succ === 12; // 12 คือ ไม่สำเร็จ
        const isNegotiated = (c: any) => c.negotiate === 1 || c.negotiate === 9 || isNegotiateSucc(c) || isNegotiateFail(c); // เจรจาแล้ว หรือมีผลการเจรจา
        const isGetEyeSucc = (c: any) => c.geteye === 1 || c.geteye === 13; // 13 คือ จัดเก็บได้
        const isGetEyeFail = (c: any) => c.geteye === 2 || c.geteye === 14; // 14 คือ จัดเก็บไม่ได้
        const getEyeCount = (c: any) => {
            if (c.eyetotal === 16 || c.eyetotal === 1) return 1;
            if (c.eyetotal === 17 || c.eyetotal === 2) return 2;
            if (c.eyetotal === 15 || c.eyetotal === 0) return 0;
            return 0;
        };

        const totalCases = allCases.length;
        const potentialCases = allCases.filter(isPotential).length;
        const evaluatedCases = allCases.filter(isEvaluated).length;
        const wardNotifiedCases = allCases.filter(isWardToTc).length;
        const negotiatedCases = allCases.filter(isNegotiated).length;
        const negotiateSucc = allCases.filter(isNegotiateSucc).length;
        const negotiateFail = allCases.filter(isNegotiateFail).length;
        const negotiateNotYet = allCases.filter((c: any) => c.negotiate_succ === null).length;
        const getEyeSucc = allCases.filter(isGetEyeSucc).length;
        const getEyeFail = allCases.filter(isGetEyeFail).length;

        const totalEyes = allCases.reduce((sum: number, c: any) => sum + getEyeCount(c), 0);
        const totalDonors = allCases.filter((c: any) => getEyeCount(c) > 0).length;

        // 1. สรุปภาพรวม & อัตราความสำเร็จ (%) สำหรับ 4 การ์ดบน
        const summary = {
            total_cases: totalCases,
            potential_cases: potentialCases,
            potential_rate: totalCases > 0 ? Number(((potentialCases / totalCases) * 100).toFixed(1)) : 0,
            consented_cases: negotiateSucc,
            consented_rate: negotiatedCases > 0 ? Number(((negotiateSucc / negotiatedCases) * 100).toFixed(1)) : 0,
            negotiated_cases: negotiatedCases,
            total_eyes_collected: totalEyes, // ตัวเลขช่อง "0 ดวงตา"
            total_donors: totalDonors,       // ตัวเลขช่อง "0 ผู้บริจาค"
            negotiate_success_rate: negotiatedCases > 0 ? Number(((negotiateSucc / negotiatedCases) * 100).toFixed(1)) : 0,
            procurement_success_rate: negotiateSucc > 0 ? Number(((getEyeSucc / negotiateSucc) * 100).toFixed(1)) : 0,
        };

        // 2. ลำดับขั้นตอน (Funnel Stage)
        const funnel = {
            total_cases: totalCases,
            potential_cases: potentialCases,
            evaluated_cases: evaluatedCases,
            ward_notified: wardNotifiedCases,
            negotiated: negotiatedCases,
            negotiate_success: negotiateSucc,
            geteye_success: getEyeSucc,
        };

        // 3. สัดส่วนและประเภท (Distribution สำหรับ Donut Charts)
        const breakdown = {
            death_type: {
                brain_death: allCases.filter((c: any) => c.braincardiac === 1).length,
                cardiac_death: allCases.filter((c: any) => c.braincardiac === 2).length,
            },
            negotiate_status: {
                success: negotiateSucc,
                failed: negotiateFail,
                not_yet: negotiateNotYet,
            },
            geteye_status: {
                success: getEyeSucc,
                failed: getEyeFail,
            },
            eyes_yield: {
                two_eyes: allCases.filter((c: any) => getEyeCount(c) === 2).length,
                one_eye: allCases.filter((c: any) => getEyeCount(c) === 1).length,
                zero_eye: allCases.filter((c: any) => getEyeCount(c) === 0).length,
            },
        };
        return {
            summary,
            funnel,
            breakdown
        };
    }
}



