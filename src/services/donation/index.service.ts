import { SearchPatService } from "../pat/serchPat.service";
import { Op } from "sequelize";
import db from "../../models/eyes-donation";
import dbPPK from "../../models/ppkhosp";
import { DateHelper } from "../pat/helpers/date.helper";
import { CompletenessHelper } from "../../utils/completeness.helper";

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

            const missingFields = CompletenessHelper.getMissingFields(rawForm);
            const isComplete = rawForm.is_complete !== undefined && rawForm.is_complete !== null && Number(rawForm.is_complete) === 1
                ? 1
                : (missingFields.length === 0 ? 1 : 0);

            return {
                ...rawForm,
                hn: rawForm.hn || null,
                fullname,
                cid: patientInfo.citizencardno || null,
                deathtext: deadInfo.diagdetail || null,
                is_complete: isComplete,
                missing_fields: missingFields,
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

        const missingFields = CompletenessHelper.getMissingFields(cleanCase);
        const isComplete = cleanCase.is_complete !== undefined && cleanCase.is_complete !== null && Number(cleanCase.is_complete) === 1
            ? 1
            : (missingFields.length === 0 ? 1 : 0);

        return {
            ...cleanCase,
            fullname: patientInfo.fullname || null,
            cid: patientInfo.cid || null,
            deathtext: patientInfo.deathtext || null,
            icd10: patientInfo.icd10 || null,
            is_complete: isComplete,
            missing_fields: missingFields,
        };
    }
    static async getStatistics(query?: { startDate?: string; endDate?: string; year?: number | string; month?: number | string; months?: number | string }) {
        const selectedYear = query?.year && query.year !== "all" ? parseInt(String(query.year), 10) : undefined;
        const selectedMonth = query?.month && query.month !== "all" ? parseInt(String(query.month), 10) : undefined;

        const where: any = {};

        // รองรับการ filter ช่วงวันที่ (ดูตาม fristtime เป็นหลัก หากไม่มีให้ดู createdAt)
        if (query?.startDate && query?.endDate) {
            where[Op.or] = [
                {
                    fristtime: {
                        [Op.between]: [new Date(`${query.startDate} 00:00:00`), new Date(`${query.endDate} 23:59:59`)],
                    },
                },
                {
                    [Op.and]: [
                        { fristtime: null },
                        {
                            createdAt: {
                                [Op.between]: [new Date(`${query.startDate} 00:00:00`), new Date(`${query.endDate} 23:59:59`)],
                            },
                        },
                    ],
                },
            ];
        }

        const allCases = await db.DonorCase.findAll({
            where,
            order: [
                ["fristtime", "ASC"],
                ["createdAt", "ASC"],
            ],
        });

        // ฟังก์ชันช่วยดึงวันที่จากเคส
        const getCaseDate = (c: any): Date | null => {
            const raw = c.fristtime || c.createdAt;
            if (!raw) return null;
            const d = new Date(raw);
            return isNaN(d.getTime()) ? null : d;
        };

        // กรองเคสสำหรับ Summary, Funnel และ Breakdown ตามปี/เดือนที่เลือก
        let targetCases = allCases;
        if (selectedYear) {
            targetCases = targetCases.filter((c: any) => {
                const d = getCaseDate(c);
                return d ? d.getFullYear() === selectedYear : false;
            });
        }
        if (selectedMonth) {
            targetCases = targetCases.filter((c: any) => {
                const d = getCaseDate(c);
                return d ? (d.getMonth() + 1) === selectedMonth : false;
            });
        }

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

        const totalCases = targetCases.length;
        const potentialCases = targetCases.filter(isPotential).length;
        const evaluatedCases = targetCases.filter(isEvaluated).length;
        const wardNotifiedCases = targetCases.filter(isWardToTc).length;
        const negotiatedCases = targetCases.filter(isNegotiated).length;
        const negotiateSucc = targetCases.filter(isNegotiateSucc).length;
        const negotiateFail = targetCases.filter(isNegotiateFail).length;
        const negotiateNotYet = targetCases.filter((c: any) => c.negotiate_succ === null).length;
        const getEyeSucc = targetCases.filter((c: any) => isNegotiateSucc(c) && isGetEyeSucc(c)).length;
        const getEyeFail = targetCases.filter(isGetEyeFail).length;

        const totalEyes = targetCases.reduce((sum: number, c: any) => sum + getEyeCount(c), 0);
        const totalDonors = targetCases.filter((c: any) => getEyeCount(c) > 0).length;

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
            procurement_success_rate: negotiateSucc > 0 ? Number(Math.min(100, (getEyeSucc / negotiateSucc) * 100).toFixed(1)) : 0,
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
                brain_death: targetCases.filter((c: any) => c.braincardiac === 1).length,
                cardiac_death: targetCases.filter((c: any) => c.braincardiac === 2).length,
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
                two_eyes: targetCases.filter((c: any) => getEyeCount(c) === 2).length,
                one_eye: targetCases.filter((c: any) => getEyeCount(c) === 1).length,
                zero_eye: targetCases.filter((c: any) => getEyeCount(c) === 0).length,
            },
        };
        // 4. แนวโน้มรายเดือน (ส่งทุกเดือนที่มีในระบบ และครบทั้ง 12 เดือนของทุกปี เพื่อให้หน้าบ้าน filter เองได้)
        const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

        const getYearMonth = (dateVal: any): { key: string; year: number; month: number } | null => {
            if (!dateVal) return null;
            if (typeof dateVal === "string") {
                const match = dateVal.match(/^(\d{4})-(\d{2})/);
                if (match) {
                    const y = parseInt(match[1], 10);
                    const m = parseInt(match[2], 10);
                    if (y && m >= 1 && m <= 12) {
                        return { key: `${y}-${match[2]}`, year: y, month: m };
                    }
                }
            }
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return null;
            const y = d.getFullYear();
            const m = d.getMonth() + 1;
            const key = `${y}-${String(m).padStart(2, "0")}`;
            return { key, year: y, month: m };
        };

        const now = new Date();
        const currentYear = now.getFullYear();
        const yearsSet = new Set<number>([currentYear]);

        // รวบรวมปีทั้งหมดจากเคส เพื่อให้มีโครงเดือนครบทุกปีที่มีข้อมูล
        allCases.forEach((c: any) => {
            const dateVal = c.fristtime || c.createdAt;
            const ym = getYearMonth(dateVal);
            if (ym) {
                yearsSet.add(ym.year);
            }
        });

        const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);

        const monthlyMap = new Map<string, {
            month: string;
            year: number;
            month_num: number;
            label: string;
            month_name: string;
            cases: number;
            screened: number;
            total_cases: number;
            consented: number;
            negotiate_succ: number;
            eyes_collected: number;
            donors: number;
        }>();

        // สร้างโครงให้ครบทั้ง 12 เดือน (ม.ค. - ธ.ค.) สำหรับทุกปี
        sortedYears.forEach((year) => {
            for (let m = 1; m <= 12; m++) {
                const monthStr = String(m).padStart(2, "0");
                const key = `${year}-${monthStr}`;
                const label = thaiMonths[m - 1];
                monthlyMap.set(key, {
                    month: key,
                    year,
                    month_num: m,
                    label,
                    month_name: label,
                    cases: 0,
                    screened: 0,
                    total_cases: 0,
                    consented: 0,
                    negotiate_succ: 0,
                    eyes_collected: 0,
                    donors: 0,
                });
            }
        });

        allCases.forEach((c: any) => {
            // ใช้ fristtime (วันเวลาที่บันทึก/รับแจ้งเคส) เป็นหลัก หากไม่มีให้ใช้ createdAt
            const dateVal = c.fristtime || c.createdAt;
            if (!dateVal) return;
            const ym = getYearMonth(dateVal);
            if (!ym) return;

            let item = monthlyMap.get(ym.key);
            if (!item) {
                const monthStr = String(ym.month).padStart(2, "0");
                const label = thaiMonths[ym.month - 1] || monthStr;
                item = {
                    month: ym.key,
                    year: ym.year,
                    month_num: ym.month,
                    label,
                    month_name: label,
                    cases: 0,
                    screened: 0,
                    total_cases: 0,
                    consented: 0,
                    negotiate_succ: 0,
                    eyes_collected: 0,
                    donors: 0,
                };
                monthlyMap.set(ym.key, item);
            }

            const eyeCount = getEyeCount(c);
            item.cases += 1;
            item.screened += 1;
            item.total_cases += 1;
            if (isNegotiateSucc(c)) {
                item.consented += 1;
                item.negotiate_succ += 1;
            }
            item.eyes_collected += eyeCount;
            if (eyeCount > 0) {
                item.donors += 1;
            }
        });

        const allTrends = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
        const activeYear = selectedYear || currentYear;
        const yearTrends = allTrends.filter((m) => m.year === activeYear);
        const monthly_trends = yearTrends.length > 0 ? yearTrends : allTrends;

        // 5. สรุปเหตุผลที่ปฏิเสธ / จัดเก็บไม่ได้ (Top Reasons เพื่อการพัฒนาคุณภาพ CQI)
        const countReasons = (field: string) => {
            const counts: Record<string, number> = {};
            allCases.forEach((c: any) => {
                const reason = c[field]?.trim();
                if (reason) {
                    counts[reason] = (counts[reason] || 0) + 1;
                }
            });
            return Object.entries(counts)
                .map(([reason, count]) => ({ reason, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
        };

        const top_reasons = {
            non_evaluated: countReasons("commentnonchk"),
            non_negotiated: countReasons("commentnonnego"),
            non_retrieved: countReasons("commentnoget"),
        };

        return {
            summary,
            funnel,
            breakdown,
            monthly_trend: monthly_trends,
            available_years: sortedYears,
            top_reasons,
        };
    }
}



