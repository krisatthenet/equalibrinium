/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("categories");

  const record = new Record(collection);
  record.set("name", "Nanny");
  record.set("description", "Childcare and babysitting");
  record.set("icon", "baby");
  try {
    app.save(record);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Skipping duplicate: Nanny");
    } else {
      throw e;
    }
  }
}, (app) => {
  try {
    const record = app.findFirstRecordByData("categories", "name", "Nanny");
    app.delete(record);
  } catch (_) {}
});
