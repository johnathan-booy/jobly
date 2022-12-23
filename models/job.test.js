"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
	const newJob = {
		title: "New",
		salary: 100000,
		equity: "0.001",
		companyHandle: "c1",
	};

	test("works", async function () {
		let job = await Job.create(newJob);
		expect(job.title).toEqual("New");

		const result = await db.query(
			`SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'New'`
		);
		expect(result.rows).toEqual([
			{
				id: expect.any(Number),
				...newJob,
			},
		]);
	});
});

/************************************** findAll */

describe("findAll", function () {
	test("works: no filter", async function () {
		let jobs = await Job.findAll();
		expect(jobs).toEqual([
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
		]);
	});

	test("works: filter title", async function () {
		let filters = { title: "1" };
		let jobs = await Job.findAll(filters);
		expect(jobs).toEqual([
			{
				id: expect.any(Number),
				title: "J1",
				salary: 100000,
				equity: "0",
				companyHandle: "c1",
			},
		]);
	});

	test("works: filter minSalary", async function () {
		let filters = { minSalary: 200000 };
		let jobs = await Job.findAll(filters);
		expect(jobs).toEqual([
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
		]);
	});

	test("works: filter hasEquity", async function () {
		let filters = { hasEquity: true };
		let jobs = await Job.findAll(filters);
		expect(jobs).toEqual([
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
		]);
	});

	test("works: filter all", async function () {
		let filters = { title: "J", minSalary: 300000, hasEquity: true };
		let jobs = await Job.findAll(filters);
		expect(jobs).toEqual([
			{
				id: expect.any(Number),
				title: "J3",
				salary: 300000,
				equity: "0.003",
				companyHandle: "c3",
			},
		]);
	});
});

/************************************** get */

describe("get", function () {
	test("works", async function () {
		let job = await Job.get(1);
		expect(job).toEqual({
			id: expect.any(Number),
			title: "J1",
			salary: 100000,
			equity: "0",
			companyHandle: "c1",
		});
	});

	test("not found if no such job", async function () {
		try {
			await Job.get(0);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** update */

describe("update", function () {
	const updateData = {
		title: "New",
		salary: 1_000_000,
		equity: "0.001",
	};

	test("works", async function () {
		let job = await Job.update(1, updateData);
		expect(job).toEqual({
			id: 1,
			companyHandle: "c1",
			...updateData,
		});

		const result = await db.query(
			`SELECT
				id,
				title,
				salary,
				equity,
				company_handle AS "companyHandle"
           FROM jobs
           WHERE id = 1`
		);
		expect(result.rows).toEqual([
			{
				id: expect.any(Number),
				title: "New",
				salary: 1_000_000,
				equity: "0.001",
				companyHandle: "c1",
			},
		]);
	});

	test("works: null fields", async function () {
		const updateDataSetNulls = {
			title: "New",
			salary: null,
			equity: null,
		};

		let job = await Job.update(1, updateDataSetNulls);
		expect(job).toEqual({
			id: 1,
			companyHandle: "c1",
			...updateDataSetNulls,
		});

		const result = await db.query(
			`SELECT
				id,
				title,
				salary,
				equity,
				company_handle AS "companyHandle"
           FROM jobs
           WHERE id = 1`
		);
		expect(result.rows).toEqual([
			{
				id: expect.any(Number),
				title: "New",
				salary: null,
				equity: null,
				companyHandle: "c1",
			},
		]);
	});

	test("not found if no such job", async function () {
		try {
			await Job.update(0, updateData);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test("bad request with no data", async function () {
		try {
			await Job.update(1, {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/************************************** remove */

describe("remove", function () {
	test("works", async function () {
		await Job.remove(1);
		const res = await db.query("SELECT id FROM jobs WHERE id=1");
		expect(res.rows.length).toEqual(0);
	});

	test("not found if no such job", async function () {
		try {
			await Job.remove(0);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
