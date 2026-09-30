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
            throw new Error("Data not found (��辺�������ʺ�ԨҤ���)");
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
}


