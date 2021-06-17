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

export default class RoomHelper {
    public table: any;
    public roomDatasets: RoomDataset[];
    public buildingDatasets: BuildingDataset[];

    constructor() {
        Log.trace("RoomHelper::init()");
        this.table = {};
        this.roomDatasets = [];
        this.buildingDatasets = [];
    }

    public addRooms(id: string, content: string, insight: InsightDataset[], finalReturn: string[]): Promise<string[]> {
        let jsZip = new JSZip();
        let promises: Array<Promise<any>> = [];
        let these = this;
        return new Promise(function (resolve, reject) {
            jsZip.loadAsync(content, {base64: true}).then((result: JSZip) => {
                if (result.files["rooms/"].dir) {
                    if (result.file("rooms/index.htm") !== null) {
                        result.file("rooms/index.htm").async("text").then((result2: string) => {
                            let document = parse5.parse(result2);
                            if (these.getTable(document, "Building")) {
                                these.buildingDatasets = FindRoom.getBuildingsInfo(these.table);
                                these.getAllBuildingInfoWithAvailableGeo(these.table).then(() => {
                                    for (let building of these.buildingDatasets) {
                                        promises.push(result.file("rooms/" + building["href"].slice(2)).async("text")
                                            .then((result4: string) => {
                                                return Promise.resolve
                                                (these.getInfoOfRoomOfOneBuilding(result4, building));
                                            }).catch((err: any) => {
                                                return Promise.reject(new InsightError("Should not " + err));
                                            }));
                                    }
                                    these.getAllPromise(promises, insight, finalReturn, id).then((f: any) => {
                                        return resolve(f);
                                    }).catch((err: any) => {
                                        return reject(new InsightError("Should not " + err));
                                    });
                                }).catch((err: any) => {
                                    return reject(new InsightError("Should not " + err));
                                });
                            } else {
                                return reject(new InsightError("Should not add an invalid dataset"));
                            }
                         }).catch((err: any) => {
                            return reject(new InsightError("Should not " + err));
                         });
                    } else {
                        return reject(new InsightError("Should not add an invalid dataset"));
                    }
                } else {
                    return reject(new InsightError("Should not add an invalid dataset"));
                }
            }).catch((err: any) => {
                return reject(new InsightError("Should not add " + err));
            });
        });
    }

    public getAllPromise(promises: Array<Promise<any>>, insight: InsightDataset[], finalReturn: string[],
                         id: string): Promise<string[]> {
        let these = this;
        return new Promise(function (resolve, reject) {
            Promise.all(promises).then((result: []) => {
                for (let re of result) {
                    if (re !== undefined) {
                        these.roomDatasets = these.roomDatasets.concat(re);
                    }
                }
                let newSet: InsightDataset = {id: "", numRows: 0, kind: InsightDatasetKind.Rooms};
                newSet.id = id;
                newSet.numRows = these.roomDatasets.length;
                if (these.roomDatasets.length > 0) {
                    finalReturn.push(id);
                    insight.push(newSet);
                } else {
                    return reject(new InsightError("Should not add"));
                }
                if (!fs.existsSync("./data")) {
                    fs.mkdirSync("./data");
                }
                fs.writeFile("./data/" + id + ".json", JSON.stringify(these.roomDatasets)
                    , function (err) {
                        return reject(new InsightError("Should not add"));
                    });
                return resolve(finalReturn);
            });
        });
    }

    public getInfoOfRoomOfOneBuilding(result4: string, buildingDataset: BuildingDataset): RoomDataset[] {
        let roomDocument = parse5.parse(result4);
        if (this.getTable(roomDocument, "room")) {
            let rooms: any = this.table["childNodes"][3]["childNodes"];
            let roomDataset: RoomDataset = {fullname: "", shortname: "", number: "",
                name: "", address: "",
                lat: 0, lon: 0, seats: 0, type: "", furniture: "", href: ""};
            let roomDatasets: RoomDataset[] = [];
            for (let room of rooms) {
                if (room["nodeName"] === "tr") {
                    let roomTrNode: any = room["childNodes"];
                    roomDataset = FindRoom.setRoomInfoOfRoom(roomTrNode, buildingDataset);
                    if (roomDataset.name !== "") {
                        roomDatasets.push(roomDataset);
                    }
                }
            }
            return roomDatasets;
        }
    }

    public getTable(document: any, kind: string): any {
        let keys: any[] = Object.keys(document);
        if (keys.includes("childNodes")) {
            let childNodes: any[] = document["childNodes"];
            if (childNodes !== null) {
                for (let node of childNodes) {
                    if (this.checkNodeInBuildings(node, kind)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private checkNodeInBuildings(node: any, kind: string): any {
        if (node["nodeName"] === "table") {
            if (FindRoom.checkInSideTable(node, kind)) {
                this.table = node;
                return true;
            } else {
                return false;
            }
        } else {
            if (this.getTable(node, kind)) {
                return true;
            }
        }
    }

    // get list of new address like http://cs310.students.cs.ubc.ca:11316/api/v1/project_team<TEAM NUMBER>/6245%2...;
    public changeAddressFormat(table: any): any {
        for (let buildingDataset of this.buildingDatasets) {
            let partOfAddress: any[] = buildingDataset["address"].split(" ");
            let newAddress: string = partOfAddress[0];
            for (let i = 1; i < partOfAddress.length; i++) {
                newAddress = newAddress.concat("%20" + partOfAddress[i]);
            }
            buildingDataset.searchInfo = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team055/" + newAddress;
        }
    }

    public getAllBuildingInfoWithAvailableGeo(table: any): Promise<any> {
        let these = this;
        let promises: Array<Promise<string>> = [];
        return new Promise(function (resolve, reject) {
            these.changeAddressFormat(table);
            for (let buildingDataset of these.buildingDatasets) {
                promises.push(these.getGeo(buildingDataset));
            }
            Promise.all(promises).then((result: []) => {
                let i = 0;
                for (let re of result) {
                    if (re["error"] === undefined) {
                        these.buildingDatasets[i]["lat"] = (re["lat"]);
                        these.buildingDatasets[i]["lon"] = (re["lon"]);
                        i++;
                    }
                }
                return resolve(0);
            }).catch((err: any) => {
                return reject(err);
            });
        });
    }

    public getGeo(building: any): Promise<any> {
        let url = building["searchInfo"];
        let these = this;
        return new Promise(function (resolve, reject) {
            https.get(url, (res) => {
                res.setEncoding("utf8");
                let body = "";
                res.on("data", (data) => {
                    body += data;
                });
                res.on("end", () => {
                    try {
                        let parsedData = JSON.parse(body);
                        // if (parsedData.error === undefined) {
                        //     return resolve(parsedData);
                        // }
                        return resolve(parsedData);
                    } catch (e) {
                        these.buildingDatasets.splice(these.buildingDatasets.indexOf(building), 1);
                        return reject(e);
                    }
                });
            });
        });
    }
}
