/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    try {
        const collection = app.findCollectionByNameOrId("users");
        const field = collection.fields.getByName("userType");
        if (!field || field.type !== "select") return;

        // Migrate any remaining "master" records to "contractor"
        const masters = app.findAllRecords("users", $dbx.exp(`userType = 'master'`));
        for (const r of masters) {
            r.set("userType", "contractor");
            app.saveNoValidate(r);
        }

        field.values = ["client", "contractor", "influencer"];
        app.save(collection);
    } catch(e) {
        console.log("userType fix skipped: " + e.message);
    }
}, (app) => {
    try {
        const collection = app.findCollectionByNameOrId("users");
        const field = collection.fields.getByName("userType");
        if (field && field.type === "select") {
            field.values = ["client", "master", "contractor", "influencer"];
            app.save(collection);
        }
    } catch(_) {}
});
