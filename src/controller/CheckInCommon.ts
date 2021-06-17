import {
    IcourseSection,
} from "./IInsightFacade";
import CheckWO from "./CheckWO";
import CheckTrans from "./CheckTrans";
import CourseQueryHelper from "./CourseQueryHelper";
import RoomQueryHelper from "./RoomQueryHelper";

export default class CheckInCommon {

    public static recursionCheck(whereObj: any, query: any, finalReturn: any[]): any {
        let baseCase: any[] = ["GT", "LT", "EQ", "IS"];
        let recursionCase: any[] = ["NOT", "AND", "OR"];
        let insideWhereObj: {} = Object.values(whereObj)[0];
        if (baseCase.includes(Object.keys(whereObj)[0]) && Object.keys(whereObj).length === 1) {
            if (!CheckTrans.checkTMatch(query)) {
                return this.checkMatchKeyAndComparison(whereObj, query)
                    && CheckWO.checkTenKeyInW(query, whereObj, finalReturn)
                    && CheckWO.checkNumStringMatch(whereObj, query);
            } else {
                return this.checkMatchKeyAndComparison(whereObj, query)
                    && RoomQueryHelper.checkTenKeyInWWithT(query, whereObj, finalReturn)
                    && CheckWO.checkNumStringMatch(whereObj, query);
            }
        }
        let key = Object.keys(whereObj)[0];
        if (recursionCase.includes(key)) {
            if (Object.keys(whereObj)[0] === "NOT") {
                if (typeof Object.values(whereObj) === "object") {
                    return this.recursionCheck(insideWhereObj, query, finalReturn);
                } else {
                    return false;
                }
            }
            if (["AND", "OR"].includes(Object.keys(whereObj)[0])) {
                let arr: any = Object.values(whereObj)[0];
                return this.insideCheck(arr, query, finalReturn);
            }
        } else {
            return false;
        }
    }

    public static insideCheck(arr: any[], query: any, finalReturn: any[]): boolean {
        if (arr.length >= 1) {
            for (let obj of arr) {
                if (!this.recursionCheck(obj, query, finalReturn)) {
                    return false;
                }
            }
        } else {
            return false;
        }
        return true;
    }

    public static checkMatchKeyAndComparison(obj: any, query: any): boolean {
        let mKeys: any[] = ["avg", "pass", "fail", "audit", "year"];
        let mRoomKeys: any[] = ["lat", "lon", "seats"];
        let sKeys: any[] = ["dept", "id", "uuid", "title", "instructor"];
        let sRoomKeys: any[] = ["fullname", "shortname", "number", "name", "address", "type",
            "furniture", "href"];
        let compareKeys: any[] = Object.keys(obj);
        let compareValues: any[] = Object.values(obj);
        for (let compareValue of compareValues) {
            if (compareValue === null ||  compareValue === undefined) {
                return false;
            }
        }
        if (["GT", "LT", "EQ", "IS"].includes(compareKeys[0])) {
            if (["GT", "LT", "EQ"].includes(compareKeys[0])) {
                if (compareKeys.length === 1 && compareValues.length === 1) {
                    let test: any = Object.keys(compareValues[0]);
                    if (test.length !== 0) {
                        return this.checkMkeysHelper(compareValues, mKeys, mRoomKeys, query);
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
            if (["IS"].includes(compareKeys[0])) {
                if (Object.keys(compareKeys).length === 1 && compareValues.length === 1) {
                    if (Object.keys(compareValues[0]).length !== 0) {
                        return this.checkSKeysHelper(compareValues, sKeys, sRoomKeys, obj, query);
                    }
                } else {
                    return false;
                }
            }
        } else {
            return false;
        }
    }

    public static checkMkeysHelper (compareValues: any[], mKeys: any[], mRoomKeys: any, query: any): boolean {
        if (CheckTrans.checkType(query) === "courses") {
            return this.checkMKeys(compareValues, mKeys);
        } else {
            return this.checkMKeys(compareValues, mRoomKeys);
        }
    }

    public static checkMKeys(compareValues: any[], mKeys: any[]): boolean {
        if (Object.values(compareValues[0]).length === 1) {
            for (let key of Object.keys(compareValues[0])) {
                if (!mKeys.includes(key.split("_")[1])) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }

    public static checkSKeysHelper(compareValues: any[], sKeys: any[], sRoomKeys: any, obj: any, query: any): boolean {
        if (CheckTrans.checkType(query) === "courses") {
            return this.checkSKeys(compareValues, sKeys, obj);
        } else {
            return this.checkSKeys(compareValues, sRoomKeys, obj);
        }
    }

    public static checkSKeys(compareValues: any[], sKeys: any[], obj: any): boolean {
        if (Object.values(compareValues[0]).length === 1) {
            for (let key of Object.keys(compareValues[0])) {
                if (!sKeys.includes(key.split("_")[1])) {
                    return false;
                }
            }
            return CheckWO.checkInputString(obj);
        } else {
            return false;
        }
    }


    public static enterArray(obj: any, secArr: any[]): any[] {
        let resultArray = obj["result"];
        if (resultArray !== undefined) {
            if (resultArray.length !== 0) {
                for (let jsonObj of resultArray) {
                    this.enterArraySec(jsonObj, secArr);
                }
            }
        }
        return secArr;
    }

    public static enterArraySec(jsonObj: any, secArr: any[]): any {
        if (Object.keys(jsonObj).includes("Title") && Object.keys(jsonObj).includes("id")
            && Object.keys(jsonObj).includes("Course") && Object.keys(jsonObj).includes("Audit")
            && Object.keys(jsonObj).includes("Avg") && Object.keys(jsonObj).includes("Professor")
            && Object.keys(jsonObj).includes("Pass") && Object.keys(jsonObj).includes("Fail")
            && Object.keys(jsonObj).includes("Year") && Object.keys(jsonObj).includes("Subject")) {
            let sec: IcourseSection = {
                dept: "", id: "", avg: 0, instructor: "", title: "", pass: 0,
                fail: 0, audit: 0, uuid: "", year: 0
            };
            sec.title = jsonObj["Title"];
            sec.uuid = jsonObj["id"].toString(10);
            sec.id = jsonObj["Course"];
            sec.audit = jsonObj["Audit"];
            sec.avg = jsonObj["Avg"];
            sec.instructor = jsonObj["Professor"];
            sec.pass = jsonObj["Pass"];
            sec.fail = jsonObj["Fail"];
            sec.year = parseInt(jsonObj["Year"], 10);
            sec.dept = jsonObj["Subject"];
            if (jsonObj["Section"] === "overall") {
                sec.year = 1900;
            }
            secArr.push(sec);
        }
    }

    public static checkQueryValid(query: any,  res: any[], finalReturn: any[]): boolean {
        if (CheckTrans.checkTMatch(query)) {
            return this.checkValidWithT(query, finalReturn);
        } else {
            return this.checkValidWithOutT(query, res, finalReturn);
        }
    }

    public static checkValidWithOutT(query: any, res: any[], finalReturn: any[]): boolean {
        if (RoomQueryHelper.checkOnlyTwoKey(query)) {
            let whereObj = query["WHERE"];
            let optionObj = query["OPTIONS"];
            return (Object.keys(whereObj).length === 0 && this.checkInsideOptionsStruct(query)
                && CheckWO.checkTenKeyInO(query, finalReturn))
                || (Object.keys(whereObj).length === 1 && typeof whereObj === "object"
                    && this.checkInsideOptionsStruct(query) && CheckWO.checkTenKeyInO(query, finalReturn)
                    && CheckInCommon.recursionCheck(query["WHERE"], query, finalReturn)
                    );
        } else {
            return false;
        }
    }

    public static checkValidWithT(query: any, finalReturn: any[]): boolean {
        if (RoomQueryHelper.checkOnlyThreeKey(query)) {
            let whereObj = query["WHERE"];
            if ((Object.keys(whereObj).length === 0 && this.checkInsideOptionsStruct(query)
                && CourseQueryHelper.checkInsideTransformationStruct(query)
                && RoomQueryHelper.checkTenKeyInOWithT(query, finalReturn)
                && RoomQueryHelper.checkTenKeyInT(query, finalReturn)
                && RoomQueryHelper.returnIDWithT(query) !== null)
                || (Object.keys(whereObj).length === 1 && typeof whereObj === "object"
                    && CourseQueryHelper.checkInsideTransformationStruct(query) && this.checkInsideOptionsStruct(query)
                    && CheckInCommon.recursionCheck(query["WHERE"], query, finalReturn)
                )) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }

    }

    public static checkInsideOptionsStruct(query: any): boolean {
        let op: any = query["OPTIONS"];
        if ( op === null ||  op === undefined || Object.keys(op).length <= 0) {
            return false;
        } else {
            if (Object.keys(op).includes("COLUMNS") && !Object.keys(op).includes("ORDER") &&
                 op["COLUMNS"] !== null && op["COLUMNS"] !== undefined) {
                let testCm: any = op["COLUMNS"];
                for (let opkey of Object.keys(op)) {
                    if (opkey !== "COLUMNS") {
                        return false;
                    }
                }
                return testCm.length >= 1 ;
            } else if (Object.keys(op).includes("COLUMNS") && Object.keys(op).includes("ORDER")
                && op["COLUMNS"] !== null &&  op["COLUMNS"] !== undefined &&
                op["ORDER"] !== null &&  op["ORDER"] !== undefined) {
                let testCm: any = op["COLUMNS"];
                let testOd: any = op["ORDER"];
                return this.checkInsideOptionsOrderStruct(query, op, testOd, testCm);
            } else {
                return false;
            }
        }
    }

    public static checkInsideOptionsOrderStruct(query: any, op: any, testOd: any, testCm: any): boolean {
        for (let opkey of Object.keys(op)) {
            if (opkey === "COLUMNS" || opkey === "ORDER") {
                //
            } else {
                return false;
            }
        }
        if (typeof testOd === "string") {
            return testCm.length >= 1;
        } else if (typeof testOd === "object") {
            if (Object.keys(testOd).includes("dir") && Object.keys(testOd).includes("keys")
                &&  testOd["keys"] !== null &&  testOd["keys"] !== undefined) {
                for (let odkey of Object.keys(testOd)) {
                    if (odkey === "keys" || odkey === "dir") {
                        //
                    } else {
                        return false;
                    }
                }
                return (testCm.length >= 1) && (testOd["dir"] === "UP" || testOd["dir"] === "DOWN")
                    && testOd["keys"].length >= 1 ;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    public static getApplyKey(query: any): boolean {
        let tr: any = query["TRANSFORMATIONS"];
        let apply: any[] = tr["APPLY"];
        let Akey: string[] = [];
        for (let a of apply) {
            if (!Akey.includes(Object.keys(a)[0]) && !Object.keys(a)[0].includes("_")) {
                Akey.push(Object.keys(a)[0]);
            } else {
                return false;
            }
        }
        return true;
    }
}
