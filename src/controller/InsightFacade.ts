import Log from "../Util";
import {
    IcourseSection,
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
import CheckWO from "./CheckWO";
import CheckInCommon from "./CheckInCommon";
import JSZip = require("jszip");
import fs = require("fs");
import RoomHelper from "./RoomHelper";
import CheckTrans from "./CheckTrans";
import CourseQueryHelper from "./CourseQueryHelper";

export default class InsightFacade implements IInsightFacade {
    public insight: InsightDataset[];
    public finalReturn: string[];
    private roomHelper: RoomHelper;
    public queryDataset: Map<string, any[]> = new Map();
    constructor() {
        this.insight = [];
        this.finalReturn = [];
        this.roomHelper = new RoomHelper();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let regExp = new RegExp("([_])");
        let these = this;
        return new Promise(function (resolve, reject) {
            if (id !== null && id !== undefined ) {
                if (!regExp.test(id) && id.replace(/\s/g, "").length !== 0) {
                    if (CheckWO.checkNoDuplicate(id, these.insight)) {
                        if (kind === InsightDatasetKind.Courses) {
                            these.addCourse(id, content, kind).then((result: any) => {
                                return resolve(result);
                            }).catch((err: any) => {
                                return reject(new InsightError("Should not add an invalid dataset"));
                            });
                        } else if (kind === InsightDatasetKind.Rooms) {
                            these.roomHelper.addRooms(id, content, these.insight, these.finalReturn)
                                .then((result2: any) => {
                                return resolve(result2);
                            }).catch((err: any) => {
                                return reject(new InsightError("Should not add an invalid dataset"));
                            });
                        } else {
                            return reject(new InsightError("Should not add an invalid dataset"));
                        }
                    } else {
                      return reject(new InsightError("Should not add an invalid dataset"));
                       }
                } else {
                      return reject(new InsightError("Should not add an invalid dataset"));
                       }
            } else {
                     return reject(new InsightError("Should not add an invalid dataset"));
                   }
               });
    }

    public addCourse (id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let jsZip = new JSZip();
        let sectionArray: any[] = [];
        let newSet: InsightDataset = {id: "", kind: InsightDatasetKind.Courses, numRows: 0};
        let promises: Array<Promise<string>> = [];
        let these = this;
        return new Promise(function (resolve, reject) {
            jsZip.loadAsync(content, {base64: true}).then((result: JSZip) => {
                if (result.files["courses/"].dir) {
                    result.folder("courses").forEach(function (relativePath, file) {
                        promises.push(file.async("text"));
                    });
                    Promise.all(promises).then(async (result2: []) => {
                        if (!these.checkEmptyPromiseArray(result2)) {
                            if (!these.parseJsonObject(result2, id, sectionArray, newSet, kind)) {
                                return reject(new InsightError("Should not add dataset"));
                            }
                            await fs.writeFile("./data/" + id + ".json", JSON.stringify(sectionArray)
                                , function (err) {
                                    return reject(new InsightError("Should not add"));
                                });
                            return resolve(these.finalReturn);
                        } else {
                            return reject(new InsightError("Should not add"));
                        }
                    }).catch((err: any) => {
                        return reject(new InsightError("Should not " + err));
                    });
                } else {
                    return reject(new InsightError("Should not add an invalid dataset"));
                }
            }).catch((err: any) => {
                return reject(new InsightError("Should not add " + err));
            });
        });
    }

    public checkEmptyPromiseArray(promiseArray: []): any {
        return promiseArray.length === 0;
    }

    public skipInvalid(s: string): boolean {
        try {
            JSON.parse(s);
        } catch (e) {
           return false;
        }
        return true;
    }

    public parseJsonObject(array: [], id: string, sectionArray: any[], newSet: InsightDataset,
                           kind: InsightDatasetKind): any {
        for (let s of array) {
            let obj = {};
            if (!this.skipInvalid(s)) {
                obj = {};
            } else {
                obj = JSON.parse(s);
            }
            sectionArray = CheckInCommon.enterArray(obj, sectionArray);
            newSet.id = id;
            newSet.kind = kind;
            newSet.numRows = sectionArray.length;
    }
        if (sectionArray.length > 0) {
            this.finalReturn.push(id);
            this.insight.push(newSet);
            for (let section of sectionArray) {
                if (section.title == null || section.uuid == null || section.id == null || section.audit == null
                    || section.avg == null || section.instructor == null || section.pass == null || section.fail == null
                    || section.year == null || section.dept == null) {
                    return false;
                }
            }
            if (!fs.existsSync("./data")) {
                fs.mkdirSync("./data");
            }
            return true;
        } else {
            return false;
        }
    }

    public removeDataset(id: string): Promise<string> {
        let regExp = new RegExp("([_])");
        let these = this;
        return new Promise((resolve, reject) => {
            if (id !== null && id !== undefined) {
                if (!regExp.test(id) && id.replace(/\s/g, "").length !== 0) {
                    if (!CheckWO.checkNoDuplicate(id, these.insight)) {
                       these.removeFromInsight(id, these.insight);
                       fs.unlink("./data/" + id + ".json", (err) => {
                            if (err) {
                            return reject(new InsightError("Should not add an invalid dataset"));
                            }
                        });
                       return resolve(id);
                    } else {
                      return reject(new NotFoundError("Should not add an invalid dataset"));
                        }
                } else {
                      return reject(new InsightError("Should not add an invalid dataset"));
                       }
            } else {
                return reject(new InsightError("Should not add an invalid dataset"));
                   }
        });
    }

    public removeFromInsight(id: string, insight: any[]): any {
        let i = 0;
        for (let set of this.insight) {
            if (set.id === id) {
                this.insight.splice(i, 1);
                break;
            } else {
                i++;
            }
        }
    }

    public performQuery(query: any): Promise<any[]> {
        if (typeof query === "string") {
            query = JSON.parse(query);
        }
        let these = this;
        let res: any[] = [];
        return new Promise(function (resolve, reject) {
            if (query !== null && query !== undefined) {
                if (CheckWO.checkWOMatch(query)) {
                        if (CheckInCommon.checkQueryValid(query, res, these.finalReturn)) {
                            let whereObj = query["WHERE"];
                            let optionObj = query["OPTIONS"];
                            res = these.performQ(query, res, whereObj, optionObj);
                            if (res.length > 5000) {
                                return reject(new ResultTooLargeError("too large"));
                            } else {
                                return resolve(res);
                            }
                        } else {
                            return reject(new InsightError("invalid form"));
                        }
                    } else {
                        return reject(new InsightError("invalid form"));
                    }
                } else {
                    return reject(new InsightError("query is in invalid form"));
                }
        });
    }

    public pushCourseSec(whereObj: any, optionObj: any, query: any, courseSec: any, res: any[] ): any {
        if (whereObj === null && whereObj === undefined) {
            return false;
        }
        if (Object.keys(whereObj).length === 0 && Object.keys(optionObj).length !== 0) {
            res.push(courseSec);
        } else {
            if (this.recursionValid(query["WHERE"], courseSec)) {
                res.push(courseSec);
            }
        }
    }

    public recursionValid(whereObj: any, courseSec: any): boolean {
        if (whereObj === null && whereObj === undefined) {
            return false;
        }
        let baseCase: any[] = ["GT", "LT", "EQ", "IS"];
        let insideWhereObjs: any = Object.values(whereObj);
        for (let oneInsideObj of insideWhereObjs) {
            if (oneInsideObj === null && oneInsideObj === undefined) {
                return false;
            }
        }
        let insideWhereObj: any = Object.values(whereObj)[0];
        let key = Object.keys(whereObj)[0];
        if (baseCase.includes(key)) {
            return CheckWO.getBaseCase(courseSec, whereObj);
        }
        if (Object.keys(whereObj)[0] === "NOT") {
            return !this.recursionValid(insideWhereObj, courseSec);
        }
        if (Object.keys(whereObj)[0] === "OR") {
            for (let obj of insideWhereObj) {
                if (this.recursionValid(obj, courseSec)) {
                    return true;
                }
            }
            return false;
        }
        if (Object.keys(whereObj)[0] === "AND") {
            for (let obj of insideWhereObj) {
                if (obj === null && obj === undefined) {
                    return false;
                }
                if (!this.recursionValid(obj, courseSec)) {
                    return false;
                }
            }
            return true;
        }
    }

    public performQ(query: any, res: any, whereObj: any, optionObj: any): any {
        let id: string = "";
        if (CheckTrans.checkTMatch(query)) {
            id = query["TRANSFORMATIONS"]["GROUP"][0].split("_")[0];
        } else {
            id = query["OPTIONS"]["COLUMNS"][0].split("_")[0];
        }
        this.queryDataset = CourseQueryHelper.getDataset(id, this.queryDataset);
        let dataset = this.queryDataset.get(id);
        if (CheckTrans.checkTMatch(query)) {
            return CourseQueryHelper.performQWithT(dataset, query, res, whereObj, optionObj);
        } else {
            return CourseQueryHelper.performQWithoutT(dataset, query, res, whereObj, optionObj);
        }
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let these = this;
        return new Promise(function (resolve) {
            return resolve(these.insight);
        });
    }
}
