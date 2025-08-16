const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const fs = require("fs");

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

function validate(schemaFile, dataFile) {
  const schema = JSON.parse(fs.readFileSync(schemaFile, "utf8"));
  const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));

  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (valid) {
    console.log(`${dataFile} is VALID against ${schemaFile}`);
  } else {
    console.log(`${dataFile} is INVALID against ${schemaFile}`);
    console.log(validate.errors);
  }
}

// Run validations
validate("identity-request-schema.json", "identity-request-template.json");
validate("identity-verification-schema.json", "identity-verification-template.json");
validate("register-maintenance-event-schema.json", "register-maintenance-event-template.json");

