/// <reference path="../pb_data/types.d.ts" />

// Adds a "bug" source option to cs_tickets for the new report-a-bug widget,
// same pattern as 1782100000_dispute_flow.js adding "dispute".
migrate((app) => {
  const cs = app.findCollectionByNameOrId("cs_tickets");

  const sourceField = cs.fields.getByName("source");
  if (sourceField && !sourceField.values.includes("bug")) {
    sourceField.values = [...sourceField.values, "bug"];
  }

  app.save(cs);
  console.log("cs_tickets: added bug source option");
}, (app) => {
  const cs = app.findCollectionByNameOrId("cs_tickets");
  const sourceField = cs.fields.getByName("source");
  if (sourceField) {
    sourceField.values = sourceField.values.filter((v) => v !== "bug");
  }
  app.save(cs);
});
