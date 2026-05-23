/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const users = app.findAllRecords("users");
  for (const user of users) {
    if (!user.get("referralCode")) {
      const code = user.id.substring(0, 8).toUpperCase();
      user.set("referralCode", code);
      app.save(user);
    }
  }
}, () => {});
