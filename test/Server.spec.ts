import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import Log from "../src/Util";
import * as fs from "fs";
import {NotFoundError} from "../src/controller/IInsightFacade";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        server.start().then((result: any) => {
            Log.trace("Let's start");
        }).catch((err: any) => {
            Log.trace("There are some errors!! Fix them.");
        });
    });

    after(function () {
        // TODO: stop server here once!
        server.stop().then((result: any) => {
            Log.trace("Let's stop");
        }).catch((err: any) => {
            Log.trace("There are some errors!! Fix them.");
        });
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    // TODO: read your courses and rooms datasets here once!
    let coursesFile = fs.readFileSync("./test/data/courses.zip");
    let query = {
        WHERE: {
            GT: {
                courses_avg: 99
            }
        },
        OPTIONS: {
            COLUMNS: [
                "courses_id",
                "courses_uuid",
                "courses_avg"
            ],
            ORDER: {
                dir: "DOWN",
                keys: [
                    "courses_id"
                ]
            }
        }
    };

    // Sample on how to format PUT requests

    it("PUT test for courses dataset successfully", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .send(coursesFile)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            Log.trace("There is an error. Handle it");
        }
    });

    it("PUT test for combine dataset successfully", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/combine/courses")
                .send(coursesFile)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            Log.trace("There is an error. Handle it");
        }
    });

    it("PUT test for courses dataset not successfully", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses_/courses")
                .send(coursesFile)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace("There is an error. Handle it");
        }
    });

    it("Delete test for courses dataset successfully", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .send(coursesFile)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    return chai.request("http://localhost:4321")
                        .del("/dataset/courses").send(coursesFile)
                        .then(function (result: Response) {
                            expect(result.status).to.be.equal(200);
                        }).catch(function (err) {
                            expect.fail();
                        });
                }).catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            Log.trace("There is an error. Handle it");
        }
    });

    it("Delete test for courses dataset not successfully InsightError", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .send(coursesFile)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    return chai.request("http://localhost:4321")
                        .del("/dataset/courses_").send(coursesFile)
                        .then(function (result: Response) {
                            expect.fail();
                        }).catch(function (err) {
                            expect(err.status).to.be.equal(400);
                        });
                }).catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            Log.trace("There is an error. Handle it");
        }
    });

    it("Delete test for hi dataset not successfully NotFoundError", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/hi")
                .send(coursesFile)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            Log.trace("There is an error. Handle it");
        }
    });

    it("Post test for courses dataset successfully", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .send(coursesFile)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    return chai.request("http://localhost:4321")
                        .post("/query").send(query)
                        .then(function (result: Response) {
                            expect(result.status).to.be.equal(200);
                        }).catch(function (err) {
                            expect.fail();
                        });
                }).catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            Log.trace("There is an error. Handle it");
        }
    });
    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
