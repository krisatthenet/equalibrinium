/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    try {
        const collection = app.findCollectionByNameOrId("client_locations");
        collection.createRule = "@request.auth.id != ''";
        collection.listRule = "clientId = @request.auth.id";
        collection.viewRule = "clientId = @request.auth.id";
        collection.updateRule = "clientId = @request.auth.id";
        collection.deleteRule = "clientId = @request.auth.id";
        app.save(collection);
        console.log("client_locations rules fixed");
    } catch (e) {
        console.log("fix_client_locations_rules skipped: " + e.message);
    }
}, (app) => {});
