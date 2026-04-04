/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  const field = collection.fields.getByName("userType");
  if (!field || field.type !== "select") return;

  // First migrate any remaining 'master' records to 'contractor'
  const masters = app.findAllRecords("users", $dbx.exp(`userType = 'master'`));
  for (const record of masters) {
    record.set("userType", "contractor");
    app.saveNoValidate(record);
  }

  // Update allowed values: remove 'master', add 'contractor'
  field.values = ["client", "contractor", "influencer"];
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  const field = collection.fields.getByName("userType");
  if (!field || field.type !== "select") return;
  field.values = ["client", "master", "contractor", "influencer"];
  app.save(collection);
});
