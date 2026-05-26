/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("auction_tickets");

  const recurringField = new Field({
    id: "recurring_field",
    name: "recurring",
    type: "bool",
    required: false,
    presentable: false,
    unique: false,
    options: {},
  });

  const recurringFrequencyField = new Field({
    id: "recurringFrequency_field",
    name: "recurringFrequency",
    type: "select",
    required: false,
    presentable: false,
    unique: false,
    options: {
      maxSelect: 1,
      values: ["weekly", "monthly"],
    },
  });

  collection.fields.add(recurringField);
  collection.fields.add(recurringFrequencyField);

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("auction_tickets");

  collection.fields.removeById("recurring_field");
  collection.fields.removeById("recurringFrequency_field");

  app.save(collection);
});
