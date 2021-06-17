import Log from "../Util";
import {
    IcourseSection,
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError, ResultTooLargeError
} from "./IInsightFacade";
import CheckWO from "./CheckWO";
import CheckTrans from "./CheckTrans";
import fs = require("fs");
import {type} from "os";
import InsightFacade from "./InsightFacade";
import Decimal from "decimal.js";

export default class CourseQueryHelper {

    public static checkInsideTransformationStruct(query: any): boolean {
        let tr: any = query["TRANSFORMATIONS"];
        if (tr !== null && tr !== undefined && typeof tr === "object") {
            if (Object.keys(tr).length <= 1) {
                return false;
            } else {
                if (Object.keys(tr).includes("APPLY") && Object.keys(tr).includes("GROUP") && tr["GROUP"] !== null
                    && tr["GROUP"] !== undefined && tr["GROUP"].length !== 0
                    && tr["APPLY"] !== null && tr["APPLY"] !== undefined &&
                    tr["APPLY"][0] !== null && tr["GROUP"][0] !== null) {
                   return this.checkInsideTransformationHelper(query, tr);
                } else {
                    return false;
                }
            }
        } else {
            return false;
        }
    }

    public static checkInsideTransformationHelper(query: any, tr: any): boolean {
        for (let tkey of Object.keys(tr)) {
            if (tkey !== "APPLY" && tkey !== "GROUP") {
                return false;
            }
        }
        if (Array.isArray(tr["APPLY"]) && Array.isArray(tr["GROUP"]) ) {
            return CheckTrans.checkApp(query, tr);
        } else {
            return false;
        }
    }

    public static checkApplyRule(query: any): boolean {
        let tr: any = query["TRANSFORMATIONS"];
        let apply: any = tr["APPLY"];
        let rule: string[] = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
        for (let a of apply) {
            if (!rule.includes(Object.keys(Object.values(a)[0])[0])) {
                return false;
            }
        }
        return true;

    }

    public static checkApplyRuleMatch(query: any): boolean {
        let tr: any = query["TRANSFORMATIONS"];
        let apply: any = tr["APPLY"];
        let mrule: string[] = ["MAX", "MIN", "AVG", "SUM"];
        let mkey: string[] = ["lat", "lon", "seats"];
        let mcoursekey: string[] = ["avg", "pass", "fail", "audit", "year"];
        let scoursekey: string[] = ["avg", "pass", "fail", "audit", "year",
            "dept", "id", "uuid", "title", "instructor"];
        let srule: string[] = ["COUNT"];
        let skey: string[] = ["fullname", "shortname", "number", "name", "address", "type",
            "furniture", "href", "lat", "lon", "seats"];
        for (let a of apply) {
            let key = Object.values(Object.values(a)[0])[0];
            if (typeof key !== "string") {
                return false;
            }
            if (mrule.includes(Object.keys(Object.values(a)[0])[0])) {
                if (CheckTrans.checkType(query) === "rooms") {
                    if (key.includes("_") && mkey.includes(key.split("_")[1]))  {
                        //
                    } else {
                        return false;
                    }
                } else if (CheckTrans.checkType(query) === "courses") {
                    if (key.includes("_") && mcoursekey.includes(key.split("_")[1]))  {
                        //
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else if (srule.includes(Object.keys(Object.values(a)[0])[0])) {
                if (CheckTrans.checkType(query) === "rooms") {
                    if (key.includes("_") && skey.includes(key.split("_")[1]))  {
                        //
                    } else {
                        return false;
                    }
                } else if (CheckTrans.checkType(query) === "courses") {
                    if (key.includes("_") && scoursekey.includes(key.split("_")[1]))  {
                        //
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    }

    // ** 得到所有不是appply的key 用于checktenkey in t
    public static getNotApplyKeyInT(query: any): any {
        let tr: any = query["TRANSFORMATIONS"];
        let group: string[] = tr["GROUP"];
        let apply: any[] = tr["APPLY"];
        let Tkey: string[] = [];
        if (group.length > 0 && Array.isArray(group)) {
            for (let g of group) {
                Tkey.push(g);
            }
            if (apply.length > 0 && Array.isArray(apply)) {
                for (let a of apply) {
                    if (Object.keys(Object.values(a)[0]).length === 1 && Object.values(Object.values(a)[0]).length === 1
                        && Object.keys(a).length === 1) {
                        Tkey.push(Object.values(Object.values(a)[0])[0]);
                    } else {
                        return null;
                    }
                }
            }
            return Tkey;
        } else {
            return null;
        }

    }

    public static getDataset (id: string, querydataset: Map<string, any[]>): Map<string, any[]> {
        if (!querydataset.has(id)) {
            let readFile = fs.readFileSync("./data/" + id + ".json");
            let data = JSON.parse(readFile.toString());
            querydataset.set(id, data);
        }
        return querydataset;
    }

    public static performQWithoutT (dataset: any, query: any, res: any, whereObj: any, optionObj: any): any {
        let insightF = new InsightFacade();
        for (let data of dataset) {
            insightF.pushCourseSec(whereObj, optionObj, query, data, res);
        }
        res = CheckWO.filterQuery(res, query);
        res = CheckWO.printResult(res, query);
        return res;
    }

    public static performQWithT (dataset: any, query: any, res: any, whereObj: any, optionObj: any): any {
        let insightF = new InsightFacade();
        for (let data of dataset) {
            insightF.pushCourseSec(whereObj, optionObj, query, data, res);
        }
        let tr = query["TRANSFORMATIONS"];
        let gr: string[] = tr["GROUP"];
        res = CheckTrans.groupDataset(res, gr);
        res = CheckTrans.apply(res, tr);
        res = CheckTrans.transferMap(query, res);
        res = this.orderWithT(query, res);
        res = CheckWO.printResult(res, query);
        return res;
    }

    public static orderWithT (query: any, dataset: any[]): any {
        let option: any = query["OPTIONS"];
        let ans: any[] = [];
        let orderKey: any = "" ;
        if (Object.keys(option).includes("ORDER")) {
            let od: any = option["ORDER"];
            if (typeof od === "string") {
                if (od.includes("_")) {
                    orderKey = od.split("_")[1];
                } else {
                    orderKey = od;
                }
                ans = CheckWO.sortOne(dataset, orderKey);
            } else {
                let dir = od["dir"];
                orderKey = this.getOKey(query);
                ans = dataset.sort((a, b) => {
                    let cols = orderKey;
                    let i = 0, result = 0, resultordem = 0;

                    while (result === 0 && i < cols.length) {
                        let col = cols[i];
                        let valcol1 = a[col];
                        let valcol2 = b[col];
                        if (valcol1 !== "null" && valcol1 !== "null") {
                            resultordem = this.compareTo(valcol1, valcol2, dir);
                            if (resultordem !== 0) {
                                break;
                            }
                        }
                        i++;
                    }
                    return resultordem;
                });
            }
        } else {
            orderKey = option["COLUMNS"][0].split("_")[1];
            ans = CheckWO.sortOne(dataset, orderKey);
        }
        return ans;
    }

    public static compareTo(val1: any, val2: any, dir: string): number {
        let result = 0;
        if (dir === "UP") {
            if (val1 < val2) {
                result = - 1;
            } else if (val1 > val2) {
                result = 1;
            } else {
                result = 0;
            }
        } else {
            if (val1 > val2) {
                result = - 1;
            } else if (val1 < val2) {
                result = 1;
            } else {
                result = 0;
            }
        }
        return result;
    }

    public static getOKey(query: any): string[] {
        let option: any = query["OPTIONS"];
        let orkeys: string[] = [];
        let or: any = option["ORDER"];
        for (let o of or["keys"]) {
            if (o.includes("_") && o.split("_").length === 2) {
                o = o.split("_")[1];
            }
            orkeys.push(o);
        }
        return orkeys;
    }

    public static applyMax(applykey: string, key: any, arr: any[] ): any {
        let shortKey = key.split("_")[1];
        let val: number = 0;
        for (let obj of arr) {
            if (obj[shortKey] > val) {
                val = obj[shortKey];
            }
        }
        let res: any = {};
        res[applykey] = val;
        return res;
    }

    public static applyMin(applykey: string, key: any, arr: any[] ): any {
        let shortKey = key.split("_")[1];
        let val: number = 100000000;
        for (let obj of arr) {
            if (obj[shortKey] < val) {
                val = obj[shortKey];
            }
        }
        let res: any = {};
        res[applykey] = val;
        return res;
    }

    public static applyAvg(applykey: string, key: any, arr: any[] ): any {
        let shortKey = key.split("_")[1];
        let sum = new Decimal(0);
        for (let obj of arr) {
            sum = sum.add(new Decimal(obj[shortKey]));
            }
        let numRow = arr.length;
        let avg = sum.toNumber() / numRow;
        let res: any = {};
        res[applykey] = Number(avg.toFixed(2));
        return res;
    }
}
