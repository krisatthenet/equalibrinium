/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("categories");

  const record = new Record(collection);
  record.set("name", "Culinary");
  record.set("description", "Catering, private chef, and culinary services");
  record.set("icon", "chef-hat");
  try {
    app.save(record);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Skipping duplicate: Culinary");
    } else {
      throw e;
    }
  }
}, (app) => {
  try {
    const record = app.findFirstRecordByData("categories", "name", "Culinary");
    app.delete(record);
  } catch (_) {}
});
