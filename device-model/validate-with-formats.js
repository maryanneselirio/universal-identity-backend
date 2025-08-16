const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const fs = require("fs");

const schemaFile = process.argv[2];
const dataFile = process.argv[3];

if (!schemaFile || !dataFile) {
  console.error("Usage: node validate-with-formats.js <schema.json> <data.json>");
  process.exit(1);
}

const schema = JSON.parse(fs.readFileSync(schemaFile, "utf8"));
const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(schema);
const valid = validate(data);

if (valid) {
  console.log(`${dataFile} is VALID against ${schemaFile}`);
} else {
  console.log(`${dataFile} is INVALID against ${schemaFile}`);
  console.log(validate.errors);
}
