/// <reference path="../pb_data/types.d.ts" />

// Runs on every PocketBase startup — ensures the users select fields always keep
// their valid values. An empty select `values` array is invalid under 0.36.7
// ("values: cannot be blank") and makes app.save(users) throw, which silently
// breaks every field-add migration (the root cause of #39). userType has needed
// this guard for a while; role is added here because it hit the same problem.
onBootstrap((e) => {
    e.next();
    try {
        const collection = $app.findCollectionByNameOrId("users");
        const specs = [
            { name: "userType", values: ["client", "contractor", "master", "influencer"] },
            { name: "role",     values: ["user", "admin"] },
        ];

        let changed = false;
        for (const spec of specs) {
            const field = collection.fields.getByName(spec.name);
            if (!field) continue;
            const current = field.values || [];
            if (spec.values.some((v) => !current.includes(v))) {
                // Replace with a fresh SelectField carrying the same id — mutating
                // the getByName() copy does not persist, and `field.type` is a
                // method (not the string "select"), so don't guard on it.
                collection.fields.add(new SelectField({
                    id: field.id,
                    name: spec.name,
                    required: false,
                    maxSelect: 1,
                    values: spec.values,
                }));
                changed = true;
            }
        }
        if (!changed) return;

        // saveNoValidate: if any other part of the collection is momentarily
        // invalid, still persist the corrected select values rather than throwing
        // (a plain save here would reproduce the exact failure mode of #39).
        $app.saveNoValidate(collection);
        $app.logger().info("ensure select values corrected", "fields", "userType, role");
    } catch (e) {
        $app.logger().error("ensure_usertype_values failed", "error", e.message);
    }
});
