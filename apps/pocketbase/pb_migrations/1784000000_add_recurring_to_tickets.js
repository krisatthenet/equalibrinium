/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("auction_tickets");

  // Remove any partially-inserted fields from prior failed runs of this migration
  // before re-adding them with the correct v0.36 constructor API.
  try { collection.fields.removeByName("recurring"); } catch (_) {}
  try { collection.fields.removeByName("recurringFrequency"); } catch (_) {}

  collection.fields.add(new BoolField({
    id:         "recurring_field",
    name:       "recurring",
    required:   false,
  }));

  collection.fields.add(new SelectField({
    id:        "recurringFrequency_field",
    name:      "recurringFrequency",
    required:  false,
    maxSelect: 1,
    values:    ["weekly", "monthly"],
  }));

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("auction_tickets");
  try { collection.fields.removeByName("recurring"); } catch (_) {}
  try { collection.fields.removeByName("recurringFrequency"); } catch (_) {}
  app.save(collection);
});
