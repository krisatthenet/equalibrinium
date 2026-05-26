/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  try {
    const col = app.findCollectionByNameOrId("notifications");
    const field = col.fields.getByName("type");
    if (field && !field.values.includes("recurring_job")) {
      field.values = [...field.values, "recurring_job"];
      app.save(col);
      console.log("notifications: added recurring_job type");
    }
  } catch (e) {
    console.error("add_recurring_job_type failed:", String(e));
  }
}, (app) => {
  try {
    const col = app.findCollectionByNameOrId("notifications");
    const field = col.fields.getByName("type");
    if (field) {
      field.values = field.values.filter(v => v !== "recurring_job");
      app.save(col);
    }
  } catch (e) {
    console.error("rollback add_recurring_job_type failed:", String(e));
  }
});
