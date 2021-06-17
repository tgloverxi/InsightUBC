import { expect } from "chai";
import * as fs from "fs-extra";
import {
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        // courses1: "./test/data/ courses1.zip",
        courses: "./test/data/courses.zip",
        rooms: "./test/data/rooms.zip",
        // courses_2 : "./test/data/courses_2 .zip",
        // _: "./test/data/_.zip",
        // _courses: "./test/data/_courses.zip",
        // co: "./test/data/co.zip",
         combine: "./test/data/combine.zip",
        // cour_ses: "./test/data/cour_ses.zip",
        invalid: "./test/data/invalid.zip",
        // dorm: "./test/data/dorm.zip",
        empty: "./test/data/empty.zip",
        // schools: "./test/data/schools.zip",
        // street: "./test/data/street.zip",
        // students: "./test/data/students.zip",
        // teachers: "./test/data/teachers.zip",
        defult: "./test/data/defult.zip",
        em: "./test/data/em.zip",
        oneemjson: "./test/data/oneemjson.zip",
        onejson: "./test/data/onejson.zip",
        onewrongjson: "./test/data/onewrongjson.zip",
        onecourse: "./test/data/onecourse.zip",
        // Nocourse: "./test/data/Nocourse.zip",
        // insideonejson: "./test/data/insideonejson.zip",
        text: "./test/data/text.txt"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    it("Should add a valid dataset", function () {
        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((resulta: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(1);
        }).catch((err: any) => {
            Log.trace(err);
            expect.fail(err, "Should not have rejected");
        });

    });
    it("Should add a valid dataset --room", function () {
        const id: string = "rooms";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((resulta: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(1);
        }).catch((err: any) => {
            Log.trace(err);
            expect.fail(err, "Should not have rejected");
        });

    });
    it("Should not add dataset with invalid id empty string", function () {
        const id: string = "";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, [], "Should not have fulfilled");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });

    });

    it("Should not add dataset with same ID as one that already exists", function () {
        const id: string = "courses";
        const expectedAdd: string[] = [id];
        const set: InsightDataset = { id: "courses", kind: InsightDatasetKind.Courses, numRows: 64612};
        const expectedDataset: InsightDataset[] = [set];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).
        then((resultofAdd: string[]) => {
            expect(resultofAdd).to.deep.equal(expectedAdd);
            return insightFacade.addDataset(id, datasets["coursesWithInvalidFile"], InsightDatasetKind.Courses).then(
                (resultOfDuplicateAdd: string[]) => {
                    expect.fail(resultOfDuplicateAdd, expectedAdd, "Should not have fulfilled promise");
                }).catch((err: any) => {
                return insightFacade.listDatasets().then((datasetsListed: InsightDataset[]) => {
                    expect(datasetsListed).to.deep.equal(expectedDataset);
                }).catch((error: any) => {
                    expect.fail(error, expectedDataset, "Should not have rejected promise");
                });
            });
        }).catch((err: any) => {
            expect.fail(err, expectedAdd, "Should not have rejected test add");
        });
    });

    it("Should not add dataset with invalid id - underscore", function () {
        const id: string = "courses";
        const expectedAdd: string[] = [id];
        const set: InsightDataset = { id: "courses", kind: InsightDatasetKind.Courses, numRows: 64612};
        const expectedDataset: InsightDataset[] = [set];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).
        then((resultofAdd: string[]) => {
            expect(resultofAdd).to.deep.equal(expectedAdd);
            return insightFacade.addDataset("cour_ses", datasets["coursesWithInvalidFile"],
                InsightDatasetKind.Courses).then(
                (resultOfRejectedAdd: string[]) => {
                    expect.fail(resultOfRejectedAdd, expectedAdd, "Should not have fulfilled promise");
                }).catch((err: any) => {
                return insightFacade.listDatasets().then((datasetsListed: InsightDataset[]) => {
                    expect(datasetsListed).to.deep.equal(expectedDataset);
                }).catch((error: any) => {
                    expect.fail(error, expectedDataset, "Should not have rejected promise");
                });
            });
        }).catch((err: any) => {
            expect.fail(err, expectedAdd, "Should not have rejected test add");
        });
    });

    it("Should not add dataset with invalid id - whitespace only characters", function () {
        const id: string = "courses";
        const expectedAdd: string[] = [id];
        const set: InsightDataset = { id: "courses", kind: InsightDatasetKind.Courses, numRows: 64612};
        const expectedDataset: InsightDataset[] = [set];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).
        then((resultofAdd: string[]) => {
            expect(resultofAdd).to.deep.equal(expectedAdd);
            return insightFacade.addDataset("   ", datasets["coursesWithInvalidFile"],
                InsightDatasetKind.Courses).then(
                (resultOfRejectedAdd: string[]) => {
                    expect.fail(resultOfRejectedAdd, expectedAdd, "Should not have fulfilled promise");
                }).catch((err: any) => {
                return insightFacade.listDatasets().then((datasetsListed: InsightDataset[]) => {
                    expect(datasetsListed).to.deep.equal(expectedDataset);
                }).catch((error: any) => {
                    expect.fail(error, expectedDataset, "Should not have rejected promise");
                });
            });
        }).catch((err: any) => {
            expect.fail(err, expectedAdd, "Should not have rejected test add");
        });
    });
    it("Should not add a invalid dataset with room kind", function () {
        const id: string = "dorm";
        return insightFacade.addDataset(id, datasets["courses"], InsightDatasetKind.Rooms)
        .then((resulta: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });

    });
    it("Should not add a invalid dataset with null id", function () {
        // const id: string = "dorm";
        return insightFacade.addDataset(null, datasets["courses"], InsightDatasetKind.Courses).
        then((resulta: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    it("Should not add a invalid dataset with undefined", function () {
        // const id: string = "dorm";
        return insightFacade.addDataset(undefined, datasets["courses"], InsightDatasetKind.Courses).
        then((resulta: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    it("Should not add a invalid dataset with null content", function () {
        const id: string = "dorm";
        return insightFacade.addDataset(id, null, InsightDatasetKind.Courses).
        then((resulta: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });

    });
    it("Should not add a invalid dataset with undefined content", function () {
        const id: string = "dorm";
        return insightFacade.addDataset(id, undefined, InsightDatasetKind.Courses).
        then((resulta: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });

    });
    it("Should add a valid dataset with space at front", function () {
        const id: string = " courses";
        return insightFacade.addDataset(id, datasets["courses"]
            , InsightDatasetKind.Courses).then((resulta: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(1);
        }).catch((err: any) => {
            expect.fail(err, "Should not have rejected");
        });
    });
    //
    it("Should add a valid dataset with space at back", function () {
        const id: string = "course ";
        return insightFacade.addDataset(id, datasets["courses"]
            , InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(1);
        }).catch((err: any) => {
            expect.fail(err, "Should not have rejected");
        });
    });
    //
    it("Should add a valid dataset with space in the middle", function () {
        const id: string = "cour ses";
        return insightFacade.addDataset(id, datasets["courses"]
            , InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(1);
        }).catch((err: any) => {
            expect.fail(err, "Should not have rejected");
        });
    });
    it("Should add a valid dataset with one json", function () {
        const id: string = "onejson";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(1);
        }).catch((err: any) => {
            expect.fail(err, "Should not have rejected");
        });

    });
    it("Should add a valid dataset with one json with one course", function () {
        const id: string = "onecourse";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(1);
        }).catch((err: any) => {
            expect.fail(err, "Should not have rejected");
        });

    });
    it("can remove a valid dataset with one json", function () {
        const id: string = "onejson";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
            return insightFacade.removeDataset(id).then((resulta: string) => {
                return insightFacade.listDatasets();
            }).then((resultb: any) => {
                expect(resultb).to.have.lengthOf(0);
            }).catch((err: any) => {
                expect.fail(err, "Should not have rejected");
            });
        });
    });
    it("can remove a valid dataset with one json with one course", function () {
        const id: string = "onecourse";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.removeDataset(id).then((resulta: string) => {
                return insightFacade.listDatasets();
            }).then((resultb: any) => {
                expect(resultb).to.have.lengthOf(0);
            }).catch((err: any) => {
                expect.fail(err, "Should not have rejected");
            });
        });
    });
    it("Should add a valid dataset with other symbol", function () {
        const id: string = "cour.ses*&z%^$#";
        return insightFacade.addDataset(id, datasets["courses"]
            , InsightDatasetKind.Courses).then((resulta: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(1);
        }).catch((err: any) => {
            expect.fail(err, "Should not have rejected");
        });
    });
    it("can remove a valid dataset with other symbol", function () {
        const id: string = "cour.ses*&z%^$#";
        return insightFacade.addDataset(id
            , datasets["courses"], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.removeDataset(id).then((resulta: string) => {
                return insightFacade.listDatasets();
            }).then((resultb: any) => {
                expect(resultb).to.have.lengthOf(0);
            }).catch((err: any) => {
                expect.fail(err, "Should not have rejected");
            });
        });
    });
    it("Should add a valid dataset with half valid files and half invalid files", function () {
        const id: string = "combine";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(1);
        }).catch((err: any) => {
            expect.fail(err, "Should not have rejected");
        });

    });
    it("can not add a invalid empty dataset", function () {
        const id: string = "empty";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    it("can not add a invalid dataset with json inside folder", function () {
        const id: string = "insideonejson";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    it("can not add a invalid dataset with json no course", function () {
        const id: string = "Nocourse";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    // it("can not remove a empty dataset", function () {
    //     const id: string = "empty";
    //     return insightFacade.removeDataset(id).then((result: string) => {
    //         return insightFacade.listDatasets();
    //     }).then((result: any) => {
    //         expect(result).to.have.lengthOf(0);
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    // it("can not remove a empty dataset with no course", function () {
    //     const id: string = "Nocourse";
    //     return insightFacade.removeDataset(id).then((result: string) => {
    //         return insightFacade.listDatasets();
    //     }).then((result: any) => {
    //         expect(result).to.have.lengthOf(0);
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    // it("can not remove a dataset with one json insde folder", function () {
    //     const id: string = "insideonejson";
    //     return insightFacade.removeDataset(id).then((result: string) => {
    //         return insightFacade.listDatasets();
    //     }).then((result: any) => {
    //         expect(result).to.have.lengthOf(0);
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    it("Should add another valid dataset", function () {
        const ida: string = "courses";
        const idb: string = "dorm";
        return insightFacade.addDataset(ida, datasets[ida], InsightDatasetKind.Courses)
    .then((resulta: string[]) => {
            return insightFacade.addDataset(idb, datasets["courses"], InsightDatasetKind.Courses)
                .then((resultb: string[]) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(2);
            }).catch((err: any) => {
                expect.fail(err, "Should not have rejected");
            });
        });
    });
    it("Should not add an invalid dataset with underscore at front", function () {
        const id: string = "_courses";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    it("Should not add an invalid dataset with underscore at back", function () {
        const id: string = "courses_";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    it("Should not add an invalid dataset with underscore in the middle", function () {
        const id: string = "cour_ses";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    it("Should not add an invalid dataset with underscore", function () {
        const id: string = "_";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    it("Should not remove an invalid dataset with underscore", function () {
        const id: string = "_";
        // const expected: string[] = [];
        return insightFacade.removeDataset(id).then((result: string) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    it("Should not add an invalid dataset with space", function () {
        const id: string = "    ";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    it("Should not remove an invalid dataset with space", function () {
        const id: string = " ";
        // const expected: string[] = [];
        return insightFacade.removeDataset(id).then((result: string) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    it("Should not add an invalid dataset emp", function () {
        const id: string = "defult";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });

    });
    it("Should not add an invalid dataset with spaces", function () {
        const id: string = "     ";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });

    });
    it("Should not remove an invalid dataset with spaces", function () {
        const id: string = "     ";
        // const expected: string[] = [];
        return insightFacade.removeDataset(id).then((result: string) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });

    });
    it("Should not add an invalid dataset with same name", function () {
        const ida: string = "courses";
        const idb: string = "courses";
        return insightFacade.addDataset(ida, datasets[ida], InsightDatasetKind.Courses).then((resulta: string[]) => {
            return insightFacade.addDataset(idb, datasets[idb], InsightDatasetKind.Courses)
                .then((resultb: string[]) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(1);
            }).catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
        });
    });
    // it("Should not add an invalid dataset with same name in all cap", function () {
    //     const ida: string = "courses";
    //     const idb: string = "COURSES";
    //     return insightFacade.addDataset(ida, datasets["courses"], InsightDatasetKind.Courses)
    //         .then((resulta: string[]) => {
    //         return insightFacade.addDataset(idb, datasets["courses"], InsightDatasetKind.Courses)
    //             .then((resultb: string[]) => {
    //             return insightFacade.listDatasets();
    //         }).then((result: any) => {
    //             expect(result).to.have.lengthOf(1);
    //         }).catch((err: any) => {
    //             expect(err).to.be.instanceOf(InsightError);
    //         });
    //     });
    // });
    it("Should not add an invalid dataset with empty id", function () {
        const id: string = "";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });

    });
    it("Should not add an invalid dataset with null", function () {
        const id: string = null;
        // const expected: string[] = []
        return insightFacade.addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
        .then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });

    });
    it("Should  add an invalid dataset with num", function () {
        const id: string = "1";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets["courses"]
            , InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(1);
        }).catch((err: any) => {
            expect.fail(err, "Should not have rejected");
        });
    });
    it("Should remove an invalid dataset with num", function () {
        const id: string = "1";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets["courses"]
            , InsightDatasetKind.Courses).then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(0);
            }).catch((err: any) => {
                expect.fail(err, "Should not have rejected");
            });
        });
    });
    it("Should not add an invalid dataset with invalid files", function () {
        const id: string = "invalid";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    it("Should not remove an invalid dataset with invalid files", function () {
        const id: string = "invalid";
        // const expected: string[] = [];
        return insightFacade.removeDataset(id).then((result: string) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    // // it("Should not add an invalid dataset with touch empty", function () {
    // //     const id: string = "defult";
    // //     // const expected: string[] = [];
    // //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
    // //     .then((result: string[]) => {
    // //         return insightFacade.listDatasets();
    // //     }).then((result: any) => {
    // //         expect(result).to.have.lengthOf(0);
    // //     }).catch((err: any) => {
    // //         expect(err).to.be.instanceOf(InsightError);
    // //     });
    // // });
    it("Should not add an invalid dataset with empty folder in empty", function () {
        const id: string = "em";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    it("Should not add an invalid dataset with one empty json file", function () {
        const id: string = "oneemjson";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });

    });
    it("Should not add an invalid dataset with one json with wrong format", function () {
        const id: string = "onewrongjson";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    it("Should not add an invalid dataset with text", function () {
        const id: string = "text";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    it("can remove a valid dataset", function () {
        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(0);
            }).catch((err: any) => {
                expect.fail(err, "Should not have rejected");
            });
        });
    });
    it("can remove a valid half dataset", function () {
        const id: string = "combine";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
        .then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(0);
            }).catch((err: any) => {
                expect.fail(err, "Should not have rejected");
            });
        });
    });

    it("can remove a valid dataset with space in the front", function () {
        const id: string = " courses";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(0);
            }).catch((err: any) => {
                expect.fail(err, "Should not have rejected");
            });
        });
    });
    it("can remove a valid dataset with space in the back", function () {
        const id: string = "courses ";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(0);
            }).catch((err: any) => {
                expect.fail(err, "Should not have rejected");
            });
        });
    });
    it("can remove a valid dataset with space in the middle", function () {
        const id: string = "cour ses";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(0);
            }).catch((err: any) => {
                expect.fail(err, "Should not have rejected");
            });
        });
    });
    it("can remove a valid dataset with spaces", function () {
        const id: string = " cour ses ";
        // const expected: string[] = [];
        return insightFacade.addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(0);
            }).catch((err: any) => {
                expect.fail(err, "Should not have rejected");
            });
        });
    });
    it("can not remove an dataset in empty base", function () {
        const id: string = "courses";
        // const expected: string[] = [];
        return insightFacade.removeDataset(id).then((resultb: string) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    it("can not remove an dataset with invalid id ", function () {
        const ida: string = "courses";
        // const expected: string[] = [];
        const id: string = "";
        return insightFacade.addDataset(ida, datasets[ida], InsightDatasetKind.Courses).then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(1);
            }).catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
        });
    });
    it("can not remove an un-existed dataset ", function () {
        const ida: string = "courses";
        // const expected: string[] = [];
        const id: string = "co";
        return insightFacade.addDataset(ida, datasets[ida], InsightDatasetKind.Courses).then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(1);
            }).catch((err: any) => {
                expect(err).to.be.instanceOf(NotFoundError);
            });
        });

    });
    it("can not remove an unexisted dataset with invalid id1 ", function () {
        const ida: string = "courses";
        // const expected: string[] = []
        const id: string = " ";
        return insightFacade.addDataset(ida, datasets[ida], InsightDatasetKind.Courses).then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(1);
            }).catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
        });
    });
    it("can not remove an unexisted dataset with invalid id ", function () {
        const ida: string = "courses";
        // const expected: string[] = [];
        const id: string = "_courses";
        // const expected: string[] = [];
        return insightFacade.addDataset(ida, datasets[ida], InsightDatasetKind.Courses).then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(1);
            }).catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
        });
    });
    it("can not remove an unexisted dataset with invalid underline", function () {
        const ida: string = "courses";
        // const expected: string[] = [];
        const id: string = "courses_";
        // const expected: string[] = [];
        return insightFacade.addDataset(ida, datasets[ida], InsightDatasetKind.Courses).then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(1);
            }).catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
        });
    });
    it("can not remove an unexisted dataset with invalid id ", function () {
        const ida: string = "courses";
        // const expected: string[] = [];
        const id: string = "cour_ses";
        // const expected: string[] = [];
        // const expected: string[] = [];
        return insightFacade.removeDataset(id).then((resultb: string) => {
            return insightFacade.listDatasets();
        }).then((result: any) => {
            expect(result).to.have.lengthOf(0);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    it("can not remove an dataset with invalid id ", function () {
        const ida: string = "courses";
        // const expected: string[] = [];
        const id: string = "";
        return insightFacade.addDataset(ida, datasets[ida], InsightDatasetKind.Courses).then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(1);
            }).catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
        });
    });
    it("can not remove an un-existed dataset ", function () {
        const ida: string = "courses";
        // const expected: string[] = [];
        const id: string = "co";
        return insightFacade.addDataset(ida, datasets[ida], InsightDatasetKind.Courses).then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(1);
            }).catch((err: any) => {
                expect(err).to.be.instanceOf(NotFoundError);
            });
        });

    });
    it("can not remove an unexisted dataset with invalid id1 ", function () {
        const ida: string = "courses";
        // const expected: string[] = []
        const id: string = " ";
        return insightFacade.addDataset(ida, datasets[ida], InsightDatasetKind.Courses).then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(1);
            }).catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
        });
    });
    it("can not remove an unexisted dataset with invalid id ", function () {
        const ida: string = "courses";
        // const expected: string[] = [];
        const id: string = "_courses";
        // const expected: string[] = [];
        return insightFacade.addDataset(ida, datasets[ida], InsightDatasetKind.Courses).then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(1);
            }).catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
        });
    });
    it("can not remove an unexisted dataset with invalid underline", function () {
        const ida: string = "courses";
        // const expected: string[] = [];
        const id: string = "courses_";
        // const expected: string[] = [];
        return insightFacade.addDataset(ida, datasets[ida], InsightDatasetKind.Courses).then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(1);
            }).catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
        });
    });
    it("can not remove an unexisted dataset with invalid id ", function () {
        const ida: string = "courses";
        // const expected: string[] = [];
        const id: string = "cour_ses";
        // const expected: string[] = [];
        return insightFacade.addDataset(ida, datasets[ida], InsightDatasetKind.Courses)
        .then((resulta: string[]) => {
            return insightFacade.removeDataset(id).then((resultb: string) => {
                return insightFacade.listDatasets();
            }).then((result: any) => {
                expect(result).to.have.lengthOf(1);
            }).catch((err: any) => {
                expect(err).to.be.instanceOf(InsightError);
            });
        });
    });
    // it("can not remove an unexisted dataset with invalid id1 defult ", function () {
    //     const id: string = "defult";
    //     // const expected: string[] = [];
    //     return insightFacade.removeDataset(id).then((result: string) => {
    //         return insightFacade.listDatasets();
    //     }).then((result: any) => {
    //         expect(result).to.have.lengthOf(0);
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    // it("can not remove an unexisted dataset with invalid id2 ", function () {
    //     const id: string = "em";
    //     // const expected: string[] = [];
    //     return insightFacade.removeDataset(id).then((result: string) => {
    //         return insightFacade.listDatasets();
    //     }).then((result: any) => {
    //         expect(result).to.have.lengthOf(0);
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    // it("can not remove an unexisted dataset with invalid id3 ", function () {
    //     const ida: string = "empty";
    //     // const expected: string[] = [];
    //     // const expected: string[] = [];
    //     return insightFacade.removeDataset(ida).then((result: string) => {
    //         return insightFacade.listDatasets();
    //     }).then((result: any) => {
    //         expect(result).to.have.lengthOf(0);
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    // it("can remove an existed dataset with invalid id4 ", function () {
    //     const id: string = "oneemjson";
    //     // const expected: string[] = [];
    //     return insightFacade.addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
    //         .then((resulta: string[]) => {
    //         return insightFacade.removeDataset(id).then((resultb: string) => {
    //             return insightFacade.listDatasets();
    //         }).then((result: any) => {
    //             expect(result).to.have.lengthOf(0);
    //         }).catch((err: any) => {
    //             expect.fail(err, "Should not have rejected");
    //         });
    //     });
    // });
    // it("can not remove an unexisted dataset with invalid id5 ", function () {
    //     const id: string = "onewrongjson";
    //     // const expected: string[] = [];
    //     return insightFacade.removeDataset(id).then((result: string) => {
    //         return insightFacade.listDatasets();
    //     }).then((result: any) => {
    //         expect(result).to.have.lengthOf(0);
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    // it("can not remove an unexisted dataset with invalid id6 ", function () {
    //     const id: string = "text";
    //     // const expected: string[] = [];
    //     return insightFacade.removeDataset(id).then((result: string) => {
    //         return insightFacade.listDatasets();
    //     }).then((result: any) => {
    //         expect(result).to.have.lengthOf(0);
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    // it("can not remove an unexisted dataset with invalid id6 ", function () {
    //     const id: string = null;
    //     // const expected: string[] = [];
    //     return insightFacade.removeDataset(id).then((result: string) => {
    //         return insightFacade.listDatasets();
    //     }).then((result: any) => {
    //         expect(result).to.have.lengthOf(0);
    //     }).catch((err: any) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of querie.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: any } = {
        courses: {id: "courses", path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
        rooms: {id: "rooms", path: "./test/data/rooms.zip", kind: InsightDatasetKind.Rooms}
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const key of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[key];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(ds.id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * For D1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    insightFacade.performQuery(test.query).then((result) => {
                        TestUtil.checkQueryResult(test, result, done);
                    }).catch((err) => {
                        TestUtil.checkQueryResult(test, err, done);
                    });
                });
            }
        });
    });
    // it("IS uuid", function () {
    //     //      let query = {
    //     //         WHERE: {
    //     //         AND: [
    //     //             {
    //     //                 GT: {
    //     //                     courses2_avg: 95
    //     //                 }
    //     //             },
    //     //             {
    //     //                 EQ: {
    //     //                     courses2_pass: 2
    //     //                 }
    //     //             }
    //     //         ]
    //     //     },
    //     //         OPTIONS: {
    //     //         COLUMNS: [
    //     //             "courses2_uuid",
    //     //             "courses2_id",
    //     //             "courses2_instructor",
    //     //             "courses2_title",
    //     //             "courses2_pass"
    //     //         ],
    //     //             ORDER: "courses2_pass"
    //     //     }
    //     //     };
    //     //      let expected = [{courses2_uuid: 71164, courses2_id: 599, courses2_instructor: "maillard, keith",
    //     //          courses2_title: "thesis", courses2_pass: 2}];
    //     //      return insightFacade.performQuery(query).then((result: any[]) => {
    //     //         expect(result).to.be.deep.equal(expected);
    //     //     }).catch((err: any) => {
    //     //         Log.trace(err);
    //     //         expect.fail(err, "fail");
    //     //     });
    //     // });
    // it("string in EQ Avg", function () {
    //     let query =  {
    //         WHERE: {
    //             AND: [
    //                 {
    //                     IS : {
    //                         rooms_furniture: "*Tables*"
    //                     }
    //                 },
    //                 {
    //                     GT: {
    //                         rooms_seats: 300
    //                     }
    //                 }
    //             ]
    //         },
    //         OPTIONS: {
    //             COLUMNS: [
    //                 "rooms_shortname",
    //                 "maxSeats"
    //             ],
    //             ORDER: {
    //                 dir : "DOWN",
    //                 keys : [
    //                     "maxSeats"
    //                 ]
    //             }
    //         },
    //         TRANSFORMATION : {
    //
    //         }
    //     };
    //     return insightFacade.performQuery(query).then((result: any[]) => {
    //         expect.fail(result, [], "invalid query should not be processed");
    //     }).catch((err: InsightError) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    // it("result too large", function () {
    //     let query = {
    //         WHERE: {
    //         },
    //         OPTIONS: {
    //             COLUMNS: [
    //                 "courses_dept",
    //                 "courses_avg"
    //             ],
    //             ORDER: "courses_avg"
    //         }
    //     };
    //     return insightFacade.performQuery(query).then((result: any[]) => {
    //         expect.fail(result, [], "invalid query with too large result should not be processed");
    //     }).catch((err: ResultTooLargeError) => {
    //         expect(err).to.be.instanceOf(ResultTooLargeError);
    //     });
    // });
    //
    // it("string in EQ", function () {
    //     let query = {
    //         WHERE: {
    //             AND: [
    //                 {
    //                     IS: {
    //                         courses_dept: "cpsc"
    //                     }
    //                 },
    //                 {
    //                     GT: {
    //                         courses_avg: 90
    //                     }
    //                 }
    //             ]
    //         },
    //         OPTIONS: {
    //             COLUMNS: [
    //                 "maxPass",
    //                 "courses_id"
    //             ],
    //             ORDER: "maxPass"
    //         },
    //         TRANSFORMATIONS: {
    //             GROUP: [
    //                 "courses_id",
    //                 "courses_id"
    //             ],
    //             APPLY: [
    //                 {
    //                     maxPass: {
    //                         MAX: "courses_pass"
    //                     }
    //                 }
    //             ],
    //             Shelley: [
    //                 "courses_id",
    //                 "courses_id"
    //             ]
    //         }
    //     };
    //     return insightFacade.performQuery(query).then((result: any[]) => {
    //         expect.fail(result, [], "invalid query should not be processed");
    //     }).catch((err: InsightError) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    // it("query NOT Object", function () {
    //     let query = [{
    //         WHERE: {
    //             EQ: {
    //                 courses_avg: "99"
    //             }
    //         }
    //     },
    //         {
    //             OPTIONS: {
    //                 COLUMNS: [
    //                     "courses_dept",
    //                     "courses_id",
    //                     "courses_avg"
    //                 ],
    //                 ORDER: "courses_avg"
    //             }
    //         }];
    //     return insightFacade.performQuery(query).then((result: any[]) => {
    //         expect.fail(result, [], "invalid query should not be processed");
    //     }).catch((err: InsightError) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    // it("dept in EQ", function () {
    //     let query = {
    //         WHERE: {
    //             EQ: {
    //                 courses_dept: "cpsc"
    //             }
    //         },
    //         OPTIONS: {
    //             COLUMNS: [
    //                 "courses_dept",
    //                 "courses_id",
    //                 "courses_avg"
    //             ],
    //             ORDER: "courses_avg"
    //         }
    //     };
    //     return insightFacade.performQuery(query).then((result: any[]) => {
    //         expect.fail(result, [], "invalid query should not be processed");
    //     }).catch((err: InsightError) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    // it("number in IS dept", function () {
    //     let query = {
    //         WHERE: {
    //             IS: {
    //                 courses_dept: 99
    //             }
    //         },
    //         OPTIONS: {
    //             COLUMNS: [
    //                 "courses_dept",
    //                 "courses_id",
    //                 "courses_avg"
    //             ],
    //             ORDER: "courses_avg"
    //         }
    //     };
    //     return insightFacade.performQuery(query).then((result: any[]) => {
    //         expect.fail(result, [], "invalid query should not be processed");
    //     }).catch((err: InsightError) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    // it("* in IS middle", function () {
    //     let query = {
    //         WHERE: {
    //             GT: {
    //                 courses_avg: 93
    //             }
    //         },
    //         OPTIONS: {
    //             COLUMNS: [
    //                 "SumScores",
    //                 "AvgPass",
    //                 "courses_dept"
    //             ],
    //             ORDER: {
    //                 keys: [
    //                     "courses_dept"
    //                 ],
    //                 dir: "DOWN"
    //             }
    //         },
    //         TRANSFORMATIONS: {
    //             GROUP: [
    //                 "courses_dept",
    //                 123
    //             ],
    //             APPLY: [
    //                 {
    //                     SumScores: {
    //                         SUM: "courses_avg"
    //                     }
    //                 },
    //                 {
    //                     AvgPass: {
    //                         AVG: "courses_pass"
    //                     }
    //                 }
    //             ]
    //         }
    //     };
    //     return insightFacade.performQuery(query).then((result: any[]) => {
    //         expect.fail(result, [], "invalid query should not be processed");
    //     }).catch((err: InsightError) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    // it("result too large", function () {
    //     let query = {
    //         WHERE: {
    //         },
    //         OPTIONS: {
    //             COLUMNS: [
    //                 "courses_dept",
    //                 "courses_avg"
    //             ],
    //             ORDER: "courses_avg"
    //         }
    //     };
    //     return insightFacade.performQuery(query).then((result: any[]) => {
    //         expect.fail(result, [], "invalid query with too large result should not be processed");
    //     }).catch((err: ResultTooLargeError) => {
    //         expect(err).to.be.instanceOf(ResultTooLargeError);
    //     });
    // });
    //
    // it("string in EQ", function () {
    //     let query = {
    //         WHERE: {
    //             AND: [
    //                 {
    //                     IS: {
    //                         rooms_furniture: "*Tab*"
    //                     }
    //                 },
    //                 {
    //                     GT: {
    //                         rooms_seats: 350
    //                     }
    //                 }
    //             ]
    //         },
    //         OPTIONS: {
    //             COLUMNS: [
    //                 "rooms_shortname",
    //                 "maxSeats"
    //             ],
    //             ORDER: {
    //                 dir: "DOWN",
    //                 keys: [
    //                     "maxSeats"
    //                 ]
    //             }
    //         },
    //         TRANSFORMATIONS: {
    //             GROUP: [
    //                 "rooms_shortname"
    //             ],
    //             APPLY: [
    //                 {
    //                     maxSeats: {
    //                         MAX: 90
    //                     }
    //                 }
    //             ]
    //         }
    //     };
    //     return insightFacade.performQuery(query).then((result: any[]) => {
    //         expect.fail(result, [], "invalid query should not be processed");
    //     }).catch((err: InsightError) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    // it("query NOT Object", function () {
    //     let query = [{
    //         WHERE: {
    //             EQ: {
    //                 courses_avg: "99"
    //             }
    //         }
    //     },
    //         {
    //             OPTIONS: {
    //                 COLUMNS: [
    //                     "courses_dept",
    //                     "courses_id",
    //                     "courses_avg"
    //                 ],
    //                 ORDER: "courses_avg"
    //             }
    //         }];
    //     return insightFacade.performQuery(query).then((result: any[]) => {
    //         expect.fail(result, [], "invalid query should not be processed");
    //     }).catch((err: InsightError) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    // it("dept in EQ", function () {
    //     let query = {
    //         WHERE: {
    //             EQ: {
    //                 courses_dept: "cpsc"
    //             }
    //         },
    //         OPTIONS: {
    //             COLUMNS: [
    //                 "courses_dept",
    //                 "courses_id",
    //                 "courses_avg"
    //             ],
    //             ORDER: "courses_avg"
    //         }
    //     };
    //     return insightFacade.performQuery(query).then((result: any[]) => {
    //         expect.fail(result, [], "invalid query should not be processed");
    //     }).catch((err: InsightError) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    // it("number in IS dedkslpt", function () {
    //     let query = {
    //         WHERE: {
    //             IS: {courses_dept: "cpsc"}
    //         },
    //         OPTIONS: {
    //             COLUMNS: ["courses_dept", "Avg"]
    //         },
    //         TRANSFORMATIONS: {
    //             GROUP: ["courses_dept"],
    //             APPLY: [
    //                 {Avg: {AVG: "courses_avg"}}
    //             ]
    //         }
    //     };
    //     return insightFacade.performQuery(query).then((result: any[]) => {
    //         expect.fail(result, [], "invalid query should not be processed");
    //     }).catch((err: InsightError) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
    // it("* in IS middle", function () {
    //     let query = {
    //         WHERE: {
    //         },
    //         OPTIONS: {
    //             COLUMNS: [
    //                 "rooms_shortname",
    //                 "maxSeats"
    //             ],
    //             ORDER: {
    //                 dir: "UP",
    //                 keys: [
    //                     "maxSeats"
    //                 ]
    //             }
    //         },
    //         TRANSFORMATIONS: {
    //             GROUP: [
    //                 "rooms_shortname"
    //             ],
    //             APPLY:
    //                 [{
    //                     maxSeats: {
    //                         MAX: "rooms_seats"
    //                     },
    //                     minSeats: {
    //                         MIN: "rooms_seats"
    //                     }
    //                 }]
    //         }
    //     };
    //     return insightFacade.performQuery(query).then((result: any[]) => {
    //         expect.fail(result, [], "invalid query should not be processed");
    //     }).catch((err: InsightError) => {
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });
});
