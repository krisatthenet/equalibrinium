/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const users = app.findAllRecords("users", $dbx.exp("id != ''"));
  for (const user of users) {
    if (!user.getString("referralCode")) {
      const code = user.id.substring(0, 8).toUpperCase();
      user.set("referralCode", code);
      app.save(user);
    }
  }
}, () => {});
