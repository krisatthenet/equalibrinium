/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  try {
    const users = app.findCollectionByNameOrId("users");

    try { users.fields.getByName("avgResponseMs"); } catch (_) {
      users.fields.add(new NumberField({ name: "avgResponseMs", required: false }));
    }

    try { users.fields.getByName("responseCount"); } catch (_) {
      users.fields.add(new NumberField({ name: "responseCount", required: false }));
    }

    app.save(users);
    console.log("users: added avgResponseMs + responseCount");
  } catch (e) {
    console.error("add_response_time_to_users failed:", String(e));
  }
}, (app) => {
  try {
    const users = app.findCollectionByNameOrId("users");
    try { users.fields.removeByName("avgResponseMs"); } catch (_) {}
    try { users.fields.removeByName("responseCount"); } catch (_) {}
    app.save(users);
  } catch (_) {}
});
