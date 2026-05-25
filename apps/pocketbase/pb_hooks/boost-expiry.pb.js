/// <reference path="../pb_data/types.d.ts" />

// Runs at midnight every day — expires boosts whose promotedUntil has passed
cronAdd("expire-boosts", "0 0 * * *", () => {
  try {
    const now = new Date().toISOString().replace("T", " ");
    const expired = $app.findAllRecords(
      "users",
      $dbx.exp(
        'isPromoted = true AND promotedUntil != "" AND promotedUntil < {:now}',
        { now }
      )
    );
    for (const user of expired) {
      user.set("isPromoted", false);
      user.set("promotedUntil", "");
      $app.save(user);
      $app.logger().info("boost expired", "userId", user.id);
    }
    if (expired.length > 0) {
      $app.logger().info("expire-boosts: expired " + expired.length + " boosts");
    }
  } catch (err) {
    $app.logger().error("expire-boosts cron failed", "error", err.message);
  }
});
