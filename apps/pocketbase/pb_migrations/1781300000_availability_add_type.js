/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let col;
  try {
    col = app.findCollectionByNameOrId("availability");
  } catch (_) { return; }

  const already = col.fields.getByName("type");
  if (already) return;

  col.fields.add(new SelectField({
    name:   "type",
    values: ["available", "priority", "holiday", "busy", "other_project"],
  }));

  app.save(col);
  console.log("availability: type field added");
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId("availability");
    col.fields.removeByName("type");
    app.save(col);
  } catch (_) {}
});
