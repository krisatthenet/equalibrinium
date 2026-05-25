/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  try {
    const col   = app.findCollectionByNameOrId("notifications");
    const field = col.fields.getByName("type");
    if (field && !field.values.includes("search_alert")) {
      field.values = [...field.values, "search_alert"];
      app.save(col);
      console.log("notifications: added search_alert type");
    }
  } catch (e) {
    console.error("add_search_alert_type failed:", String(e));
  }
}, (app) => {
  try {
    const col   = app.findCollectionByNameOrId("notifications");
    const field = col.fields.getByName("type");
    if (field) {
      field.values = field.values.filter(v => v !== "search_alert");
      app.save(col);
    }
  } catch (_) {}
});
