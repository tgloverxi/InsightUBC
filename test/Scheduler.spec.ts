import Scheduler from "../src/scheduler/Scheduler";
import {expect} from "chai";
import {SchedSection} from "../src/scheduler/IScheduler";
import {SchedRoom} from "../src/scheduler/IScheduler";

describe("scheduling test", function () {

    let scheduler: Scheduler = new Scheduler();
    let sections: SchedSection[] = [
        {
            courses_dept: "cpsc",
            courses_id: "110",
            courses_uuid: "62341",
            courses_pass: 256,
            courses_fail: 40,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "121",
            courses_uuid: "62353",
            courses_pass: 168,
            courses_fail: 17,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "110",
            courses_uuid: "62347",
            courses_pass: 23,
            courses_fail: 6,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "210",
            courses_uuid: "62361",
            courses_pass: 50,
            courses_fail: 1,
            courses_audit: 0
        }
    ];

    let rooms: SchedRoom[] = [
        {
            rooms_shortname: "WOOD",
            rooms_number: "1",
            rooms_seats: 120,
            rooms_lat: 49.26478,
            rooms_lon: -123.24673
        },
        {
            rooms_shortname: "ANGU",
            rooms_number: "098",
            rooms_seats: 260,
            rooms_lat: 49.26486,
            rooms_lon: -123.25364
        },
        {
            rooms_shortname: "ANGU",
            rooms_number: "039",
            rooms_seats: 54,
            rooms_lat: 49.26486,
            rooms_lon: -123.25364
        },
        {
            rooms_shortname: "HEBB",
            rooms_number: "10",
            rooms_seats: 54,
            rooms_lat: 49.2661,
            rooms_lon: -123.25165
        }
    ];

    it("good timetable!", function () {
        expect(scheduler.schedule(sections, rooms)).to.be.equal([]);
    });
});
