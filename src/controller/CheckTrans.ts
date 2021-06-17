import Log from "../Util";
import {
    BuildingDataset,
    IcourseSection,
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError, RoomDataset
} from "./IInsightFacade";
import decimal from "decimal.js";
import CourseQueryHelper from "./CourseQueryHelper";

export default class CheckTrans {

    public static checkTMatch(query: any): boolean {
        let objArr: any[] = Object.keys(query);
        return  objArr.includes("TRANSFORMATIONS");
    }

    public static checkType(query: any): string {
        let Ckeys: string[] = ["avg", "pass", "fail", "audit", "year", "dept", "id", "uuid", "title", "instructor"];
        let RKeys: string[] = ["fullname", "shortname", "number", "name", "address", "lat", "lon", "seats", "type",
            "furniture", "href"];
        let key: any = {};
        if (this.checkTMatch(query)) {
            key = query["TRANSFORMATIONS"]["GROUP"][0];
            if (typeof key !== "string" || !key.includes("_") || key.split("_").length !== 2) {
                return "no";
            } else {
                key = query["TRANSFORMATIONS"]["GROUP"][0].split("_")[1];
            }
        } else {
            key = query["OPTIONS"]["COLUMNS"][0];
            if (typeof key !== "string" || !key.includes("_") || key.split("_").length !== 2) {
                return "no";
            } else {
                key = query["OPTIONS"]["COLUMNS"][0].split("_")[1];
            }
        }
        if (Ckeys.includes(key)) {
            return "courses";
        } else if (RKeys.includes(key)) {
            return "rooms";
        } else {
            return "no";
        }
    }

    public static recurFindKey(whereObj: any, query: any): any {
        let baseCase: any[] = ["GT", "LT", "EQ", "IS"];
        let recursionCase: any[] = ["NOT", "AND", "OR"];
        let insideWhereObj: {} = Object.values(whereObj)[0];
        if (baseCase.includes(Object.keys(whereObj)[0]) && Object.keys(whereObj).length === 1) {
            let keystring: any = Object.keys(insideWhereObj)[0];
            if (keystring.includes("_") && keystring.split("_").length === 2) {
                return keystring.split("_")[1];
            } else {
                return false;
            }
        }
        let key = Object.keys(whereObj)[0];
        if (recursionCase.includes(key)) {
            if (Object.keys(whereObj)[0] === "NOT") {
                if (typeof Object.values(whereObj) === "object") {
                    return this.recurFindKey(insideWhereObj, query);
                } else {
                    return false;
                }
            }
            if (["AND", "OR"].includes(Object.keys(whereObj)[0])) {
                let arr: any = Object.values(whereObj)[0];
                return this.insideCheckR(arr, query);
            }
        } else {
            return false;
        }
    }

    public static insideCheckR(arr: any[], query: any): any {
        if (arr.length >= 1) {
            for (let obj of arr) {
                if (this.recurFindKey(obj, query) !== false) {
                    return this.recurFindKey(obj, query);
                }
            }
        } else {
            return false;
        }
        return false;
    }

    // **得到apply里面所有的key apply + not apply
    public static getTKey(query: any): string[] {
        let tr: any = query["TRANSFORMATIONS"];
        let group: string[] = tr["GROUP"];
        let apply: any[] = tr["APPLY"];
        let Tkey: string[] = [];
        for (let g of group) {
            Tkey.push(g);
        }
        for (let a of apply) {
            Tkey.push(Object.keys(a)[0]);
            Tkey.push(Object.values(Object.values(a)[0])[0]);
        }
        return Tkey;
    }

    public static getTKeyInC(query: any): string[] {
        let tr: any = query["TRANSFORMATIONS"];
        let group: string[] = tr["GROUP"];
        let apply: any[] = tr["APPLY"];
        let Tkey: string[] = [];
        for (let g of group) {
            Tkey.push(g);
        }
        for (let a of apply) {
            Tkey.push(Object.keys(a)[0]);
        }
        return Tkey;
    }

    public static groupDataset(datasets: any[], groupKeys: string[]): Map<string, []> {
        let map = new Map();
        map.set("1", datasets);
        return this.groupRecursion(map, groupKeys);
    }

    public static groupRecursion(map: Map<string, []>, keys: string[]): Map<string, []> {
        if (keys.length === 0) {
            return map;
        } else {
            let newMap: Map<any, []> = new Map();
            let key = keys[0];
            let keysOfMap = map.keys();
            for (let keyOfMap of keysOfMap) {
                let valueOfGivenKey = map.get(keyOfMap);
                for (let v of valueOfGivenKey) {
                    let check = v[key.split("_")[1]];
                    if (!newMap.has(keyOfMap + v[key.split("_")[1]])) {
                        let mapValue: [] = [];
                        mapValue.push(v);
                        newMap.set(keyOfMap + v[key.split("_")[1]], mapValue);
                    } else {
                        let ar = newMap.get(keyOfMap + v[key.split("_")[1]]);
                        ar.push(v);
                    }
                }
            }
            let length = keys.length;
            if (length !== 1) {
                keys = keys.slice(1, length);
            } else {
                return newMap;
            }
            return this.groupRecursion(newMap, keys);
        }
    }

    public static applySum(name: string, key: any, datasets: any[]): any {
        let shortKey = key.split("_")[1];
        let sum = 0;
        for (let dataset of datasets) {
            let temp = dataset[shortKey];
            sum += temp;
        }
        let resSum = Number(sum.toFixed(2));
        let res: any = {};
        res[name] = resSum;
        return res;
    }

    public static applyCount(name: string, key: any, datasets: []): any {
        let shortKey = key.split("_")[1];
        let count: number = 0;
        let shown: any[] = [];
        for (let dataset of datasets) {
            if (!shown.includes(dataset[shortKey])) {
                shown.push(dataset[shortKey]);
                count++;
            }
        }
        let res: any = {};
        res[name] = count;
        return res;
    }


    public static transferMap(query: any, applymap: Map<any[], any[]>): any[] {
        let applyres = applymap.keys();
        let resarr: any[] = [];
        for (let res of applyres) {
            let obj: any = {};
            for (let r of res) {
                obj[Object.keys(r)[0]] = r[Object.keys(r)[0]];
            }
            let val: any = applymap.get(res)[0];
            let keys = Object.keys(val);
            for (let k of keys) {
                obj[k] = val[k];
            }
            resarr.push(obj);
        }
        return resarr;
    }


    public static apply(map: Map<string, []>, transformation: any): Map<[], []> {
        let resMap = new Map();
        let applyArray = transformation["APPLY"];
        let mapArray = map.values();
        for (let eachGroup of mapArray) {
            let keyArray = [];
            for (let applyObj of applyArray) {
                // maxSeats
                let name = Object.keys(applyObj)[0];
                // { "MAX": "rooms_seats"}
                let value = Object.values(applyObj)[0];
                // MAX
                let applyKeyForEachObj = Object.keys(value)[0];
                // room_seats
                let searchTarget = Object.values(value)[0];
                let keyEle = {};
                switch (applyKeyForEachObj) {
                    case "MIN":
                        keyEle = CourseQueryHelper.applyMin(name, searchTarget, eachGroup);
                        break;
                    case "MAX":
                        keyEle = CourseQueryHelper.applyMax(name, searchTarget, eachGroup);
                        break;
                    case "AVG":
                        keyEle = CourseQueryHelper.applyAvg(name, searchTarget, eachGroup);
                        break;
                    case "SUM":
                        keyEle = this.applySum(name, searchTarget, eachGroup);
                        break;
                    case  "COUNT":
                        keyEle = this.applyCount(name, searchTarget, eachGroup);
                        break;
                }
                keyArray.push(keyEle);
            }
            resMap.set(keyArray, eachGroup);
        }
        return resMap;
    }

    public static checkApp(query: any, tr: any): any {
        if (tr["APPLY"].length > 0) {
            let name: string = "";
            for (let a of tr["APPLY"]) {
                if (Object.keys(a).length === 1 && typeof Object.keys(a)[0] === "string"
                    && !Object.keys(a)[0].includes("_")) {
                    if (Object.keys(a)[0] === "") {
                        return false;
                    }
                    if (name !== Object.keys(a)[0]) {
                        name = Object.keys(a)[0];
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
            return CourseQueryHelper.checkApplyRule(query) && CourseQueryHelper.checkApplyRuleMatch(query);
        } else {
            return true;
        }
    }
}
