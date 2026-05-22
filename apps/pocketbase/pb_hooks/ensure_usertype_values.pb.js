/// <reference path="../pb_data/types.d.ts" />

// Runs on every PocketBase startup — ensures userType SELECT always has all valid values.
onBootstrap((e) => {
    e.next();
    try {
        const collection = $app.findCollectionByNameOrId("users");
        const field = collection.fields.getByName("userType");
        if (!field || field.type !== "select") return;

        const required = ["client", "contractor", "master", "influencer"];
        const current = field.values || [];
        const needsUpdate = required.some(v => !current.includes(v));
        if (!needsUpdate) return;

        field.values = required;
        $app.save(collection);
        $app.logger().info("userType SELECT values corrected", "values", required.join(", "));
    } catch (e) {
        $app.logger().error("ensure_usertype_values failed", "error", e.message);
    }
});
