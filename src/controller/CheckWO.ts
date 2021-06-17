import CheckTrans from "./CheckTrans";
import RoomQueryHelper from "./RoomQueryHelper";
import CourseQueryHelper from "./CourseQueryHelper";
export default class CheckWO {
    public static checkWOMatch(query: any): boolean {
        let wokey: any[] =  ["WHERE", "OPTIONS"];
        let objArr: any[] = Object.keys(query);
        return objArr.includes(wokey[0]) && objArr.includes(wokey[1]) && query["WHERE"] !== null
            && query["WHERE"] !== undefined && query["OPTIONS"] !== null && query["OPTIONS"] !== undefined
            && typeof query["WHERE"] === "object" && typeof query["OPTIONS"] === "object"
            && !Array.isArray(query["WHERE"]) && !Array.isArray(query["OPTIONS"]) ;
    }

    public static checkInputString(obj: any): boolean {
        let input: any = obj["IS"];
        let key: any = Object.keys(input)[0];
        let value: any = input[key];
        if (typeof value === "string") {
            let len: number = value.length;
            if (len > 2) {
                return value.slice(1, len - 1).indexOf("*") === -1;
            } else {
                return true;
            }
        } else {
            return false;
        }
    }

    public static checkTenKeyInW(query: any, obj: any, final: string[]): boolean {
        let coursekeys: any[] = ["avg", "pass", "fail", "audit", "year", "dept", "id", "uuid", "title", "instructor"];
        let roomkeys: string[] = ["fullname", "shortname", "number", "name", "address", "lat", "lon", "seats", "type",
            "furniture", "href"];
        if (this.checkTenKeyInO(query, final)) {
            let idd: string = this.returnID(query);
            let val: string[] = Object.values(obj);
            let key: string = Object.keys(val[0])[0];
            if (key.includes("_") && key.split("_").length === 2) {
                let id: string = key.split("_")[0];
                let insideVal: any = Object.values(val[0])[0];
                if (CheckTrans.checkType(query) === "courses") {
                    return coursekeys.includes(key.split("_")[1]) && final.includes(id)
                        && idd === id &&  insideVal !== null &&  insideVal !== undefined;
                } else {
                    return roomkeys.includes(key.split("_")[1]) && final.includes(id)
                        && idd === id &&  insideVal !== null &&  insideVal !== undefined;
                }
            } else {
                    return false;
        }
        } else {
            return false;
        }
    }

    public static checkTenKeyInO(query: any, final: string[]): boolean {
        let coursekeys: any[] = ["avg", "pass", "fail", "audit", "year", "dept", "id", "uuid", "title", "instructor"];
        let roomkeys: string[] = ["fullname", "shortname", "number", "name", "address", "lat", "lon", "seats", "type",
            "furniture", "href"];
        if (query.hasOwnProperty("OPTIONS") && query["OPTIONS"] !== null && typeof query["OPTIONS"] === "object") {
            let op: any = query["OPTIONS"];
            let cval = op["COLUMNS"];
            if (Array.isArray(cval) && cval.length !== 0 && typeof cval[0] === "string" ) {
                let id: string = cval[0].split("_")[0];
                for (let c of cval) {
                   if (!this.checkTenKeyInCHelper(query, final, c, id, coursekeys, roomkeys)) {
                       return false;
                   }
                }
            } else {
                return false;
            }
            if (Object.keys(op).includes("ORDER")) {
                    let oval = op["ORDER"];
                    let id: string = cval[0].split("_")[0];
                    return this.checkTenKeyInOrHelper(query, final, cval, oval, id, coursekeys, roomkeys);
            } else {
                        return true;
                 }
        } else {
            return false;
        }
    }

    public  static checkTenKeyInCHelper(query: any, final: string[], c: any, id: string, coursekeys: any,
                                        roomkeys: any): boolean {
        if (typeof c === "string") {
            if (c.includes("_") && c.split("_").length === 2) {
                if (CheckTrans.checkType(query) === "courses") {
                    return id === c.split("_")[0] && final.includes(c.split("_")[0])
                        && coursekeys.includes(c.split("_")[1]);
                } else if (CheckTrans.checkType(query) === "rooms") {
                    return id === c.split("_")[0] && final.includes(c.split("_")[0])
                        && roomkeys.includes(c.split("_")[1]);
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

    public  static checkTenKeyInOrHelper(query: any, final: string[], cval: any, oval: any, id: string,
                                         coursekeys: any, roomkeys: any): boolean {
      if (RoomQueryHelper.getKeyFromOrder(query) !== null) {
          if (CheckTrans.checkType(query) === "courses") {
              return RoomQueryHelper.checkTenKeyInOHelperNoT( oval, query, cval, id, coursekeys, final );
          } else if (CheckTrans.checkType(query) === "rooms") {
              return RoomQueryHelper.checkTenKeyInOHelperNoT( oval, query, cval, id, roomkeys, final );
          } else {
              return false;
          }
      } else {
          return false;
      }
    }

    public static returnID(query: any): string {
        let op: any = query["OPTIONS"];
        let cval: string[] = op["COLUMNS"];
        return cval[0].split("_")[0];
    }

    public static checkNumStringMatch(obj: any, query: any): boolean {
        let keyone: string[] = ["avg", "pass", "fail", "audit", "year"];
        let roomkeyone: string[] = ["lat", "lon", "seats"];
        let keytwo: string[] = ["dept", "id", "uuid", "title", "instructor"];
        let roomkeytwo: string[] = ["fullname", "shortname", "number", "name", "address", "type",
            "furniture", "href"];
        let input: any = Object.values(obj);
        let key: string = Object.keys(input[0])[0].split("_")[1];
        let val: any = Object.values(input[0])[0];
        if (CheckTrans.checkType(query) === "courses") {
            if (input.length === 1 && keyone.includes(key) && typeof val === "number") {
                return true;
            }
            return input.length === 1 && keytwo.includes(key) && typeof val === "string";
        } else {
            if (input.length === 1 && roomkeyone.includes(key) && typeof val === "number") {
                return true;
            }
            return input.length === 1 && roomkeytwo.includes(key) && typeof val === "string";
        }
    }

    public static getBaseCase(courseSect: any, whereObj: any): any {
        let key: string = Object.keys(whereObj)[0];
        let res: any = [];
        if (key === "GT") {
            let courseId: string = Object.keys(whereObj["GT"])[0];
            let courseKey: string = courseId.split("_")[1];
            let num: any = Object.values(whereObj["GT"])[0];
            return courseSect[courseKey] > num;
        }
        if (key === "LT") {
            let courseId: string = Object.keys(whereObj["LT"])[0];
            let courseKey: string = courseId.split("_")[1];
            let num: any = Object.values(whereObj["LT"])[0];
            return courseSect[courseKey] < num;
        }
        if (key === "EQ") {
            let courseId: string = Object.keys(whereObj["EQ"])[0];
            let courseKey: string = courseId.split("_")[1];
            let num: any = Object.values(whereObj["EQ"])[0];
            return courseSect[courseKey] === num;
        }
        if (key === "IS") {
            let courseId: string = Object.keys(whereObj["IS"])[0];
            let courseKey: string = courseId.split("_")[1];
            let val: any = Object.values(whereObj["IS"])[0];
            if (val === "*" || val === "**") {
                return true;
            }
            return this.checkWildCard(val, courseSect, courseKey);
        }
    }

    public static checkWildCard(val: any, courseSect: any, courseKey: any): boolean {
        if (val.slice (0, 1) === "*" && val.length >= 2 && val.slice(val.length - 1, val.length) !==  "*") {
            let len = courseSect[courseKey].length;
            let val1 = courseSect[courseKey].slice(len - val.length + 1, len);
            let val2 = val.slice(1, val.length);
            return courseSect[courseKey].slice(len - val.length + 1, len) === val.slice(1, val.length);
        }
        if (val.slice (0, 1) !== "*" && val.length >= 2 && val.slice(val.length - 1, val.length) ===  "*") {
            let val1 = courseSect[courseKey].slice(0, val.length - 1);
            let val2 = val.slice(0, val.length - 1);
            return courseSect[courseKey].slice(0, val.length - 1) === val.slice(0, val.length - 1);
        }
        if (val.slice (0, 1) === "*" && val.length >= 2 && val.slice(val.length - 1, val.length) ===  "*") {
            return courseSect[courseKey].includes(val.slice(1, val.length - 1));
        }
        return courseSect[courseKey] === val;
    }

    public static filterQuery(dataset: any[], query: any): any {
        let option: any = query["OPTIONS"];
        let ans: any[];
        let orderKey: any = "";
        if (Object.keys(option).includes("ORDER")) {
            let od: any = option["ORDER"];
            if (typeof option["ORDER"] === "string") {
                orderKey = option["ORDER"].split("_")[1];
                ans = this.sortOne(dataset, orderKey);
            } else {
                let dir = od["dir"];
                orderKey = CourseQueryHelper.getOKey(query);
                ans = dataset.sort((a, b) => {
                    let cols = orderKey;
                    let i = 0, result = 0, resultordem = 0;

                    while (result === 0 && i < cols.length) {
                        let col = cols[i];
                        let valcol1 = a[col];
                        let valcol2 = b[col];
                        if (valcol1 !== "null" && valcol2 !== "null") {
                            resultordem = CourseQueryHelper.compareTo(valcol1, valcol2, dir);
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
            ans = this.sortOne(dataset, orderKey);
        }
        return ans;
    }

    public static sortOne (dataset: any[], key: string): any[] {
        let compare = (data1: any, data2: any) => {
            if (data1[key] < data2[key]) {
                return -1;
            }
            if (data1[key] > data2[key]) {
                return 1;
            }
        };
        return dataset.sort(compare);
    }

    public static printResult(dataset: any[], query: any): any {
        let option: any = query["OPTIONS"];
        let col: string[] = option["COLUMNS"];
        let ans: any[] = [];
        for (let obj of dataset) {
            let res: any = {};
            for (let key of col) {
                let origin: string = "";
                if (key.includes("_")) {
                    origin = key.split("_")[1];
                } else {
                    origin = key;
                }
                res[key] = obj[origin];
            }
            ans.push(res);
        }
        return ans;
    }
    // public static checkInsideOptions(query: any): any {
    //     let op: any = query["OPTIONS"];
    //     let testCm: any = op["COLUMNS"];
    //     let testOd: any = op["ORDER"];
    //     if (Object.keys(op).length <= 0) {
    //         return false;
    //     } else {
    //         let columnValue: any = Object.values(op);
    //         if (Object.keys(op).includes("COLUMNS") && !Object.keys(op).includes("ORDER")) {
    //             for (let opkey of Object.keys(op)) {
    //                 if (opkey !== "COLUMNS") {
    //                     return false;
    //                 }
    //             }
    //             return testCm.length >= 1 ;
    //         } else if (Object.keys(op).includes("COLUMNS")
    //             && Object.keys(op).includes("ORDER")) {
    //             for (let opkey of Object.keys(op)) {
    //                 if (opkey === "COLUMNS" || opkey === "ORDER") {
    //                     //
    //                 } else {
    //                     return false;

    public static checkNoDuplicate(id: string, insight: any) {
        for (let dataset of insight) {
            if (dataset.id.toLocaleLowerCase() === id) {
                return false;
            }
        }
        return true;
    }
}
