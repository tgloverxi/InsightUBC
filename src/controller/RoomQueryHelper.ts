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
import CheckWO from "./CheckWO";
const parse5 = require("parse5");
import fs = require("fs");
import JSZip = require("jszip");
import http = require("https");
import {toUnicode} from "punycode";
import https = require("http");
import FindRoom from "./FindRoom";
import CheckInCommon from "./CheckInCommon";
import CheckTrans from "./CheckTrans";
import {type} from "os";
import CourseQueryHelper from "./CourseQueryHelper";

export default class RoomQueryHelper {

    public static checkTenKeyInWWithT(query: any, obj: any, final: string[]): boolean {
        let roomkeys: string[] = ["fullname", "shortname", "number", "name", "address", "lat", "lon", "seats", "type",
            "furniture", "href"];
        let coursekeys: any[] = ["avg", "pass", "fail", "audit", "year", "dept", "id", "uuid", "title", "instructor"];
        if (this.checkTenKeyInOWithT(query, final) && this.checkTenKeyInT(query, final)) {
            let aa = this.returnIDWithT(query);
            if (aa !== null) {
                let idd: string = this.returnIDWithT(query);
                let val: string[] = Object.values(obj);
                let key: string = Object.keys(val[0])[0];
                if (typeof key === "string" && key.includes("_") && key.split("_").length === 2) {
                    let id: string = key.split("_")[0];
                    let insideVal: any = Object.values(val[0])[0];
                    if ( CheckTrans.checkType(query) === "courses") {
                        return coursekeys.includes(key.split("_")[1]) && final.includes(id)
                            && idd === id && insideVal !== null &&  insideVal !== undefined;
                    } else {
                        return roomkeys.includes(key.split("_")[1]) && final.includes(id)
                            && idd === id &&  insideVal !== null && insideVal !== undefined;
                    }
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

    public static returnIDWithT(query: any): string {
        let op: any = query["OPTIONS"];
        let cval: string[] = op["COLUMNS"];
        let tr: any = query["TRANSFORMATIONS"];
        let gr: string[] = tr["GROUP"];
        for (let c of cval) {
            if (typeof c === "string" && c.includes("_") && c.split("_").length === 2) {
                let id = c.split("_")[0];
                if ( id ===  gr[0].split("_")[0]) {
                    return gr[0].split("_")[0];
                } else {
                    return null;
                }
            }
        }
        return gr[0].split("_")[0];
    }

    public static checkTenKeyInOWithT(query: any, final: string[]): boolean {
        let roomkeys: string[] = ["fullname", "shortname", "number", "name", "address", "lat", "lon", "seats", "type",
            "furniture", "href"];
        let coursekeys = ["avg", "pass", "fail", "audit", "year", "dept", "id", "uuid", "title", "instructor"];
        let op: any = query["OPTIONS"];
        let tr: any = query["TRANSFORMATIONS"];
        let gr: any = tr["GROUP"][0].split("_")[0];
        if (!Object.keys(op).includes("COLUMNS")) {
            return false;
        }
        let cval: string[] = op["COLUMNS"];
        let oval: any = op["ORDER"];
        let id: string = gr;
        let Tkey: string[] = CheckTrans.getTKeyInC(query);
        if ( cval !== null &&  cval !== undefined && cval.length !== 0
            && this.checkTenKeyInC(cval, Tkey, id, final, roomkeys, coursekeys, query)) {
            if (Object.keys(op).includes("ORDER")) {
                return this.checkTenKeyInOrder(oval, query, cval, id, roomkeys, final, coursekeys);
            } else {
                return true;
            }
        } else {
                return false;
        }
    }

    public static checkTenKeyInC(cval: string[], Tkey: string[], id: string, final: string[], roomkeys: string[],
                                 courseKeys: any, query: any): boolean {
        if (CheckTrans.checkType(query) === "courses") {
           return this.checkTenKeyInCHelper(cval, Tkey, id, final, courseKeys, query);
        } else {
            return this.checkTenKeyInCHelper(cval, Tkey, id, final, roomkeys, query);
        }
    }

    public static checkTenKeyInCHelper(cval: string[], Tkey: string[], id: string, final: string[], keys: string[],
                                       query: any): boolean {
        for (let c of cval) {
            if (typeof c === "string" && Tkey.includes(c)) {
                if (c.includes("_") && c.split("_").length === 2) {
                    if (id === c.split("_")[0] && final.includes(c.split("_")[0])
                        && keys.includes(c.split("_")[1])) {
                        //
                    } else {
                        return false;
                    }
                }
            } else {
                return false;
            }
        }
        return true;
    }

    public static checkTenKeyInOrder(oval: any, query: any, cval: any, id: string, roomkeys: any, final: any,
                                     courseKeys: any): boolean {
            if (this.getKeyFromOrder(query) !== null) {
                let oarr = this.getKeyFromOrder(query);
                if (CheckTrans.checkType(query) === "courses") {
                    return this.checkTenKeyInOHelper(oval, query, cval, id, courseKeys, final, oarr);
                } else {
                    return this.checkTenKeyInOHelper(oval, query, cval, id, roomkeys, final, oarr);
                }
            } else {
                return false;
            }
    }

    public static checkTenKeyInOHelper (oval: any, query: any, cval: any, id: string, keys: any, final: any,
                                        oarr: string[]): boolean {
        for (let ov of oarr) {
            if (cval.includes(ov)) {
                if (typeof ov === "string" && ov.includes("_") && ov.split("_").length === 2 ) {
                    if (id === ov.split("_")[0] && final.includes(ov.split("_")[0])
                        && keys.includes(ov.split("_")[1])) {
                        //
                    } else {
                        return false;
                    }
                }
            } else {
                return false;
            }
        }
        return true;
    }

    public static checkTenKeyInOHelperNoT (oval: any, query: any, cval: any, id: string, keys: any, final: any):
        boolean {
        let oarr = this.getKeyFromOrder(query);
        for (let ov of oarr) {
            if (cval.includes(ov)) {
                    if (!this.checkOrHelp(ov, id, final, keys)) {
                        return false;
                    }
                } else {
                    return false;
                }
                }
        return true;
}

    public static checkOrHelp (ov: any, id: any, final: any, keys: any): boolean {
        if (ov.includes("_") && ov.split("_").length === 2 && typeof ov === "string") {
            if (id === ov.split("_")[0] && final.includes(ov.split("_")[0])
                && keys.includes(ov.split("_")[1])) {
                return true;
            } else {
                return false;
            }
         } else {
            return false;
        }
    }

    public static getKeyFromOrder(query: any): any {
        let op: any = query["OPTIONS"];
        let oval: any = op["ORDER"];
        let orderkey: string[] = [];
        if ( oval !== null &&  oval !== undefined && typeof oval === "string" && oval !== "") {
            orderkey.push(oval);
            return orderkey;
        } else if ( oval !== null && oval !== undefined &&
            typeof oval === "object" && !Array.isArray(oval)) {
            if (Array.isArray(oval["keys"]) && oval["keys"].length !== 0) {
                let oarr: string[] = oval["keys"];
                for (let oa of oarr) {
                    orderkey.push(oa);
                }
                return orderkey;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    public static checkTenKeyInT(query: any, final: string[]): boolean {
        let roomkeys: string[] = ["fullname", "shortname", "number", "name", "address", "lat", "lon", "seats", "type",
            "furniture", "href"];
        let coursekeys = ["avg", "pass", "fail", "audit", "year", "dept", "id", "uuid", "title", "instructor"];
        if (CourseQueryHelper.getNotApplyKeyInT(query) !== null) {
            let Tkey: string[] = CourseQueryHelper.getNotApplyKeyInT(query);
            let tr: any = query["TRANSFORMATIONS"];
            let gr: any[] = tr["GROUP"];
            for (let one of gr) {
                if (typeof one !== "string") {
                    return false;
                }
            }
            let id: string = gr[0].split("_")[0];
            if (CheckTrans.checkType(query) === "courses") {
                return this.checkTenKeyInTHelper(Tkey, id, coursekeys, final);
            } else {
                return this.checkTenKeyInTHelper(Tkey, id, roomkeys, final);
            }
        } else {
            return false;
        }
    }

    public static checkTenKeyInTHelper(Tkey: any, id: any, keys: any, final: any): boolean {
        for (let t of Tkey) {
            if (t.includes("_") && t.split("_").length === 2) {
                let idd: string = t.split("_")[0];
                let k: string = t.split("_")[1];
                if (idd === id && keys.includes(k) && final.includes(idd)) {
                    //
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    }

    public static checkOnlyTwoKey (query: any) {
       let keys: string[] = Object.keys(query);
       for (let key of keys) {
           if (key !== "WHERE" && key !== "OPTIONS") {
               return false;
           }
       }
       return true;
    }

    public static checkOnlyThreeKey (query: any) {
        let keys: string[] = Object.keys(query);
        for (let key of keys) {
            if (key !== "WHERE" && key !== "OPTIONS" && key !== "TRANSFORMATIONS") {
                return false;
            }
        }
        return true;
    }
}
