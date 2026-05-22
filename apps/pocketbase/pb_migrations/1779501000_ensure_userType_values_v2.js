/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    try {
        const collection = app.findCollectionByNameOrId("users");
        const field = collection.fields.getByName("userType");
        if (!field || field.type !== "select") return;

        const required = ["client", "contractor", "master", "influencer"];
        const current = field.values || [];
        const missing = required.filter(v => current.indexOf(v) === -1);
        if (missing.length === 0) return;

        field.values = required;
        app.save(collection);
        console.log("userType SELECT updated to: " + required.join(", "));
    } catch(e) {
        console.log("userType ensure v2 skipped: " + e.message);
    }
}, (app) => {});
