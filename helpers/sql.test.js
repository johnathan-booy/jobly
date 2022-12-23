const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", () => {
	const dataToUpdate = {
		firstName: "Yvonne",
		lastName: "Yukon",
		email: "test@test.com",
	};
	const jsToSql = {
		firstName: "first_name",
		lastName: "last_name",
		email: "email",
	};

	test("works: full update", () => {
		const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);
		expect(setCols).toEqual('"first_name"=$1, "last_name"=$2, "email"=$3');
		expect(values).toEqual(["Yvonne", "Yukon", "test@test.com"]);
	});

	test("works: partial update", () => {
		delete dataToUpdate.email;
		delete dataToUpdate.lastName;
		const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);
		expect(setCols).toEqual('"first_name"=$1');
		expect(values).toEqual(["Yvonne"]);
	});

	test("rejects empty data", () => {
		delete dataToUpdate.firstName;
		expect(() => {
			sqlForPartialUpdate(dataToUpdate, jsToSql);
		}).toThrow(BadRequestError);
	});
});
