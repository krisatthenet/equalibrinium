/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const team = [
    { email: "tadas@workbee.space",        title: "CEO" },
    { email: "krisatthenet@gmail.com",      title: "CTO" },
    { email: "tomas@workbee.space",        title: "CMO" },
    { email: "justas@workbee.space",       title: "COO" },
  ];

  for (const member of team) {
    try {
      const user = app.findAuthRecordByEmail("users", member.email);
      user.set("title", member.title);
      app.save(user);
    } catch (_) { /* user not yet registered, skip */ }
  }
}, (app) => {
  const emails = [
    "tadas@workbee.space",
    "krisatthenet@gmail.com",
    "tomas@workbee.space",
    "justas@workbee.space",
  ];

  for (const email of emails) {
    try {
      const user = app.findAuthRecordByEmail("users", email);
      user.set("title", "");
      app.save(user);
    } catch (_) { /* user not found, skip */ }
  }
})
