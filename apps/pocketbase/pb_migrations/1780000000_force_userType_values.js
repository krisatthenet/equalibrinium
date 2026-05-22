/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    try {
        const collection = app.findCollectionByNameOrId("users");
        const field = collection.fields.getByName("userType");
        if (!field || field.type !== "select") return;
        field.values = ["client", "contractor", "master", "influencer"];
        app.save(collection);
        console.log("userType forced to: client, contractor, master, influencer");
    } catch(e) {
        console.log("force_userType_values skipped: " + e.message);
    }
}, (app) => {});
