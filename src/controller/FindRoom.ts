import Log from "../Util";
import {BuildingDataset, RoomDataset} from "./IInsightFacade";
export default class FindRoom {

    public static getBuildingsInfo(table: any): BuildingDataset[] {
        let buildings: any = table["childNodes"][3]["childNodes"];
        let buildingDataset: BuildingDataset = {fullname: "", shortname: "", address: "",
            lat: 0, lon: 0, href: "", searchInfo: ""};
        let buildingDatasets: BuildingDataset[] = [];
        for (let building of buildings) {
            if (building["nodeName"] === "tr") {
                let nodesOfTr: any[] = building["childNodes"];
                buildingDataset = this.setInfoOfBuilding(nodesOfTr);
                if (buildingDataset.shortname !== "") {
                    buildingDatasets.push(buildingDataset);
                }
            }
        }
        return buildingDatasets;
    }

    public static setRoomInfoOfRoom(roomTrNode: any, buildingDataset: BuildingDataset): RoomDataset {
        let roomDataset: RoomDataset = {fullname: "", shortname: "", number: "",
            name: "", address: "",
            lat: 0, lon: 0, seats: 0, type: "", furniture: "", href: ""};
        for (let td of roomTrNode) {
            if (td["nodeName"] === "td") {
                roomDataset.shortname = buildingDataset.shortname;
                roomDataset.fullname = buildingDataset.fullname;
                roomDataset.address = buildingDataset.address;
                if (td["attrs"][0]["value"] === "views-field views-field-field-room-number") {
                    roomDataset.number = td["childNodes"][1]["childNodes"][0]["value"].trim();
                }
                if (td["attrs"][0]["value"] === "views-field views-field-field-room-capacity") {
                    roomDataset.seats = parseInt(td["childNodes"][0]["value"].trim(), 10);
                }
                if (td["attrs"][0]["value"] === "views-field views-field-field-room-type") {
                    roomDataset.type = td["childNodes"][0]["value"].trim();
                }
                if (td["attrs"][0]["value"] === "views-field views-field-field-room-furniture") {
                    roomDataset.furniture = td["childNodes"][0]["value"].trim();
                }
                if (td["attrs"][0]["value"] === "views-field views-field-nothing") {
                    roomDataset.href = td["childNodes"][1]["attrs"][0]["value"].trim();
                }
                roomDataset.name = roomDataset.shortname + "_" + roomDataset.number;
                roomDataset.lon = buildingDataset.lon;
                roomDataset.lat = buildingDataset.lat;
            }
        }
        return roomDataset;
    }

    public static setInfoOfBuilding(nodesOfTr: any): BuildingDataset {
        let buildingDataset: BuildingDataset = {fullname: "", shortname: "", address: "",
            lat: 0, lon: 0, href: "", searchInfo: ""};
        for (let td of nodesOfTr) {
            if (td["nodeName"] === "td") {
                if (td["attrs"][0]["value"] === "views-field views-field-field-building-code") {
                    buildingDataset.shortname = td["childNodes"][0]["value"].trim();
                }
                if (td["attrs"][0]["value"] === "views-field views-field-title") {
                    buildingDataset.fullname = td["childNodes"][1]["childNodes"][0]["value"].trim();
                }
                if (td["attrs"][0]["value"] === "views-field views-field-field-building-address") {
                    buildingDataset.address = td["childNodes"][0]["value"].trim();
                }
                if (td["attrs"][0]["value"] === "views-field views-field-nothing") {
                    buildingDataset.href = td["childNodes"][1]["attrs"][0]["value"].trim();
                }
            }
        }
        return buildingDataset;
    }
    // public static getInfoInRoomHelper(table: any, buildingDataset: BuildingDataset): Promise<any> {
    //     return new Promise(function (resolve) {
    //         let rooms: any = table["childNodes"][3]["childNodes"];
    //         let roomDatasets: RoomDataset[] = [];
    //         for (let room of rooms) {
    //             if (room["nodeName"] === "tr") {
    //                 let roomTrNode: any = room["childNodes"];
    //                 let roomDataset: RoomDataset = {fullName: "", shortName: "", number: "",
    //                 name_id: "", address: "",
    //                     lat: 0, lon: 0, seats: 0, type: "", furniture: "", href: ""};
    //                 roomDataset.shortName = buildingDataset.shortName;
    //                 roomDataset.fullName = buildingDataset.fullName;
    //                 roomDataset.address = buildingDataset.address;
    //                 if (roomTrNode[1]["attrs"][0]["value"].includes("number")) {
    //                     roomDataset.number = roomTrNode[1]["childNodes"][1]["childNodes"][0]["value"].trim();
    //                 }
    //                 if (roomTrNode[3]["attrs"][0]["value"].includes("capacity")) {
    //                     roomDataset.seats = roomTrNode[3]["childNodes"][0]["value"].trim();
    //                 } else {
    //                     roomDataset.seats = 0;
    //                 }
    //                 if (roomTrNode[7]["attrs"][0]["value"].includes("type")) {
    //                     roomDataset.type = roomTrNode[7]["childNodes"][0]["value"].trim();
    //                 }
    //                 if (roomTrNode[5]["attrs"][0]["value"].includes("furniture")) {
    //                     roomDataset.furniture = roomTrNode[5]["childNodes"][0]["value"].trim();
    //                 }
    //                 if (roomTrNode[9]["childNodes"][1]["attrs"][0]["name"].includes("href")) {
    //                     roomDataset.href = roomTrNode[9]["childNodes"][1]["attrs"][0]["value"].trim();
    //                 }
    //                 roomDataset.name_id = roomDataset.shortName + "_" + roomDataset.number;
    //                 roomDataset.lon = buildingDataset.lon;
    //                 roomDataset.lat = buildingDataset.lat;
    //                 roomDatasets.push(roomDataset);
    //             }
    //         }
    //         return resolve(roomDatasets);
    //     });
    //     // Log.trace("num of rooms" + roomDatasets.length + "in building " + buildingDataset.shortName);
    // }

    public static checkInSideTable(node: any, kind: string): boolean {
        let nodeKeys: any[] = Object.keys(node);
        if (nodeKeys.includes("childNodes")) {
            let childNodes: any[] = node["childNodes"];
            if (childNodes !== null) {
                for (let childNode of childNodes) {
                    let nodeNames: any[] = Object.keys(childNode);
                    if (this.checkValueInTable(nodeNames, childNode, kind)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private static checkValueInTable(nodeNames: any[], childNode: any, kind: string): any {
        if (nodeNames.includes("value")) {
            if (childNode["value"].includes(kind)) {
                return true;
            }
        } else {
            if (this.checkInSideTable(childNode, kind)) {
                return true;
            }
        }
    }
}
