/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("auction_tickets");

  // Add assignedContractorId field
  const assignedField = new Field({
    "hidden": false,
    "id": "text_assigned_contractor",
    "name": "assignedContractorId",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text",
    "autogeneratePattern": "",
    "max": 0,
    "min": 0,
    "pattern": ""
  });
  collection.fields.add(assignedField);

  // Add isDirect boolean field
  const isDirectField = new Field({
    "hidden": false,
    "id": "bool_is_direct",
    "name": "isDirect",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "bool"
  });
  collection.fields.add(isDirectField);

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("auction_tickets");
  collection.fields.removeById("text_assigned_contractor");
  collection.fields.removeById("bool_is_direct");
  return app.save(collection);
});
