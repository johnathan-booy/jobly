"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
	const newJob = {
		title: "New",
		salary: 100000,
		equity: "0.001",
		companyHandle: "c1",
	};

	test("ok for admin", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send(newJob)
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			job: { id: expect.any(Number), ...newJob },
		});
	});

	test("unauth when not admin", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send(newJob)
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("bad request with missing data", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send({
				title: "New",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request with invalid data", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send({
				title: "New",
				salary: -100000,
				equity: null,
				companyHandle: "this-is-way-too-long-for-the-db",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
		expect(resp.body.error.message).toContain(
			"instance.salary must have a minimum value of 0"
		);
		expect(resp.body.error.message).toContain(
			"instance.companyHandle does not meet maximum length of 10"
		);
	});
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
	test("ok for anon", async function () {
		const resp = await request(app).get("/jobs");
		expect(resp.body).toEqual({
			jobs: [
				{
					id: expect.any(Number),
					title: "J1",
					salary: 100000,
					equity: "0",
					companyHandle: "c1",
				},
				{
					id: expect.any(Number),
					title: "J2",
					salary: 200000,
					equity: "0.002",
					companyHandle: "c2",
				},
				{
					id: expect.any(Number),
					title: "J3",
					salary: 300000,
					equity: "0.003",
					companyHandle: "c3",
				},
			],
		});
	});

	test("works with title filter", async function () {
		const resp = await request(app).get("/jobs?title=1");
		expect(resp.body).toEqual({
			jobs: [
				{
					id: expect.any(Number),
					title: "J1",
					salary: 100000,
					equity: "0",
					companyHandle: "c1",
				},
			],
		});
	});

	test("works with minSalary filter", async function () {
		const resp = await request(app).get("/jobs?minSalary=200000");
		expect(resp.body).toEqual({
			jobs: [
				{
					id: expect.any(Number),
					title: "J2",
					salary: 200000,
					equity: "0.002",
					companyHandle: "c2",
				},
				{
					id: expect.any(Number),
					title: "J3",
					salary: 300000,
					equity: "0.003",
					companyHandle: "c3",
				},
			],
		});
	});

	test("works with hasEquity filter", async function () {
		const resp = await request(app).get("/jobs?hasEquity=true");
		expect(resp.body).toEqual({
			jobs: [
				{
					id: expect.any(Number),
					title: "J2",
					salary: 200000,
					equity: "0.002",
					companyHandle: "c2",
				},
				{
					id: expect.any(Number),
					title: "J3",
					salary: 300000,
					equity: "0.003",
					companyHandle: "c3",
				},
			],
		});
	});

	test("works with all filters", async function () {
		const resp = await request(app).get(
			"/jobs?title=J&minSalary=300000&hasEquity=true"
		);
		expect(resp.body).toEqual({
			jobs: [
				{
					id: expect.any(Number),
					title: "J3",
					salary: 300000,
					equity: "0.003",
					companyHandle: "c3",
				},
			],
		});
	});

	test("fails with undefined filters", async function () {
		const resp = await request(app).get("/jobs?treehugger=20");
		expect(resp.statusCode).toEqual(400);
	});

	test("fails: test next() handler", async function () {
		// there's no normal failure event which will cause this route to fail ---
		// thus making it hard to test that the error-handler works with it. This
		// should cause an error, all right :)
		await db.query("DROP TABLE jobs CASCADE");
		const resp = await request(app)
			.get("/jobs")
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(500);
	});
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
	test("works for anon", async function () {
		const resp = await request(app).get(`/jobs/1`);
		expect(resp.body).toEqual({
			job: {
				id: expect.any(Number),
				title: "J1",
				salary: 100000,
				equity: "0",
				companyHandle: "c1",
			},
		});
	});

	test("not found for no such job", async function () {
		const resp = await request(app).get(`/jobs/0`);
		expect(resp.statusCode).toEqual(404);
	});
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
	test("works for admin", async function () {
		const resp = await request(app)
			.patch(`/jobs/1`)
			.send({
				title: "New",
				salary: 150_000,
				equity: "0.001",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.body).toEqual({
			job: {
				id: expect.any(Number),
				title: "New",
				salary: 150_000,
				equity: "0.001",
				companyHandle: "c1",
			},
		});
	});

	test("unauth when not admin", async function () {
		const resp = await request(app)
			.patch(`/jobs/1`)
			.send({
				title: "New",
			})
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("unauth for anon", async function () {
		const resp = await request(app).patch(`/jobs/1`).send({
			title: "New",
		});
		expect(resp.statusCode).toEqual(401);
	});

	test("not found on no such job", async function () {
		const resp = await request(app)
			.patch(`/jobs/0`)
			.send({
				title: "New",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(404);
	});

	test("bad request on companyHandle change attempt", async function () {
		const resp = await request(app)
			.patch(`/jobs/1`)
			.send({
				companyHandle: "c1-new",
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request on invalid data", async function () {
		const resp = await request(app)
			.patch(`/jobs/1`)
			.send({
				salary: -100_000,
			})
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
	test("works for admin", async function () {
		const resp = await request(app)
			.delete(`/jobs/1`)
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.body).toEqual({ deleted: 1 });
	});

	test("unauth when not admin", async function () {
		const resp = await request(app)
			.delete(`/jobs/1`)
			.set("authorization", `Bearer ${u2Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("unauth for anon", async function () {
		const resp = await request(app).delete(`/jobs/1`);
		expect(resp.statusCode).toEqual(401);
	});

	test("not found for no such job", async function () {
		const resp = await request(app)
			.delete(`/jobs/0`)
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(404);
	});
});
