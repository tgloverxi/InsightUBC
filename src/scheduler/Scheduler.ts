import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import Log from "../Util";

export default class Scheduler implements IScheduler {

    public time: TimeSlot[];
    constructor() {
        Log.info("Scheduler");
        this.time = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100",
        "MWF 1100-1200", "MWF 1200-1300", "MWF 1300-1400",
        "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
        "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
        "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];
    }

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
       let result1: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
       let result2: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
       sections = this.sortSec(sections);
       let startRoom: SchedRoom = rooms[0];
       for (let room of rooms) {
           if (room.rooms_seats > startRoom.rooms_seats) {
               startRoom = room;
           }
       }
       let startBuild = startRoom.rooms_shortname;
       let startarr: SchedRoom[] = [];
       let buildarr: string[] = [];
       let buildord: SchedRoom[] = [];
       let buildcal: SchedRoom[] = [];
       buildarr.push(startBuild);
       buildord.push(startRoom);
       for (let room of rooms) {
           if (room.rooms_shortname === startBuild) {
               startarr.push(room);
           }
           if (!buildarr.includes(room.rooms_shortname)) {
               buildarr.push(room.rooms_shortname);
               buildcal.push(room);
           }
       }
       for (let s of startarr) {
           rooms.splice(rooms.indexOf(s), 1);
       }
       startarr = this.sortRoom(startarr);
       while (buildcal.length !== 0) {
           let nextbuild: SchedRoom = startRoom;
           for (let build of buildcal) {
               let mindist = 2147483647;
               let dist = 0;
               for (let ord of buildord) {
                   dist = dist + this.calDist(build, ord);
               }
               // ** what if ==
               if (dist < mindist) {
                   mindist = dist;
                   nextbuild = build;
               }
           }
           buildord.push(nextbuild);
           buildcal.splice(buildcal.indexOf(nextbuild), 1);
       }
       startarr = this.orderRoom(buildord, rooms, startarr);
       result1 = this.matchRoomWayOne(sections, startarr, result1);
       return result1;
    }

    public calCapcity(section: SchedSection): number {
        return section.courses_audit + section.courses_fail + section.courses_pass;
    }

    public sortSec (sections: SchedSection[]): any[] {
        let compare = (data1: any, data2: any) => {
            let key1 = "courses_audit" ;
            let key2 = "courses_fail";
            let key3 = "courses_pass";
            if (data1[key1] + data1[key2] + data1[key3] < data2[key1] + data2[key2] + data2[key3]) {
                return 1;
            }
            if (data1[key1] + data1[key2] + data1[key3] > data2[key1] + data2[key2] + data2[key3]) {
                return -1;
            }
        };
        return sections.sort(compare);
    }

    public sortRoom (rooms: SchedRoom[]): any[] {
        let compare = (data1: any, data2: any) => {
            let key1 = "rooms_seats" ;
            if (data1[key1] < data2[key1]) {
                return 1;
            }
            if (data1[key1] > data2[key1]) {
                return -1;
            }
        };
        return rooms.sort(compare);
    }

    public calDist(room1: SchedRoom, room2: SchedRoom): number {
        let lat1 = room1.rooms_lat;
        let lat2 = room2.rooms_lat;
        let lon1 = room1.rooms_lon;
        let lon2 = room2.rooms_lon;
        let R = 6371e3; // metres
        let p1 = lat1 * Math.PI / 180;
        let p2 = lat2 * Math.PI / 180;
        let dp = (lat2 - lat1) * Math.PI / 180;
        let dd = (lon2 - lon1) * Math.PI / 180;
        let a = Math.sin(dp / 2) * Math.sin(dp / 2 ) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dd / 2) * Math.sin(dd / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let d = R * c;
        return d;
    }

    public orderRoom (buildord: SchedRoom[], rooms: SchedRoom[], startarr: SchedRoom[]): any[] {
        for (let ord of buildord) {
            let roomarr: SchedRoom[] = [];
            for (let room of rooms) {
                if (room.rooms_shortname === ord.rooms_shortname) {
                    roomarr.push(room);
                    // rooms.splice(rooms.indexOf(room), 1);
                }
            }
            roomarr = this.sortRoom(roomarr);
            startarr = startarr.concat(roomarr);
        }
        return startarr;
    }

    public matchRoomWayOne(sections: SchedSection[], startarr: SchedRoom[], result: any[]): any[] {
        let courseMap: Map <string, number[]> = new Map<any, number[]>();
        let tempCourses: SchedSection[] = [];
        for (let room of startarr) {
            let i = 0;
            for (let section of sections) {
                let key = section.courses_dept.concat(section.courses_id);
                if (this.calCapcity(section) < room.rooms_seats) {
                    if (i >= 15) {
                        break;
                    }
                    if (!Array.from(courseMap.keys()).includes(key)) {
                        courseMap.set(key, [i]);
                    } else if (Array.from(courseMap.keys()).includes(key)
                        && this.matchCourseTime(i, courseMap, key) !== -1) {
                        i = this.matchCourseTime(i, courseMap, key);
                        // ** 可以吗
                        courseMap.get(key).push(i);
                    } else if (Array.from(courseMap.keys()).includes(key)
                        && this.matchCourseTime(i, courseMap, key) === -1) {
                        break;
                    }
                    let temp: any = [room, section, this.time[i]];
                    if (this.compareRes(result, temp)) {
                        result.push([room, section, this.time[i]]);
                        tempCourses.push(section);
                        i++;
                    }
                }
            }
            for (let section of tempCourses) {
                sections.splice(sections.indexOf(section), 1);
            }
        }
        return result;
    }

    public matchCourseTime (i: number, courseMap: Map <string, number[]>, key: any): number {
        while ( i < 14 && courseMap.get(key).includes(i) ) {
            i++;
        }
        if (i === 14 && courseMap.get(key).includes(i)) {
            i = -1;
        }
        return i;
    }

    public compareRes (result: any[], temp: any): boolean {
        let temparr: any[] = [];
        for (let r of result ) {
            temparr.push(r);
        }
        temparr.push(temp);
        let grade1 = this.calGrade(temparr);
        let grade2 = this.calGrade(result);
        return grade1 >= grade2;

    }

    public calGrade (temparr: any[]): number {
        let d1 = 0;
        let e1 = 0 ;
        let build1: any[] = [];
        let room1: any[] = [];
        for (let t of temparr) {
            let section: SchedSection = t[1];
            let room: SchedRoom = t[0];
            e1 = e1 + this.calCapcity(section);
            if (!build1.includes(room.rooms_shortname)) {
                build1.push(room.rooms_shortname);
                room1.push(room);
            }
        }
        let maxd = 0;
        if (room1.length > 1) {
            for (let room of room1) {
                for (let r of room1) {
                    if (r !== room) {
                       maxd = Math.max(maxd, this.calDist(room, r));
                    }
                }
            }
        }
        d1 = maxd / 1372;
        let grade = 0.7 * e1 + 0.3 * (1 - d1);
        return grade;
    }
}
