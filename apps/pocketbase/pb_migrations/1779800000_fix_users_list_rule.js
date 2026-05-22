/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    try {
        const collection = app.findCollectionByNameOrId("users");

        // Contractors and influencers are publicly visible for search.
        // Clients can only see themselves.
        const rule = "userType != 'client' || id = @request.auth.id";
        collection.listRule = rule;
        collection.viewRule = rule;

        app.save(collection);
        console.log("users list/view rule updated for public contractor search");
    } catch(e) {
        console.log("fix_users_list_rule skipped: " + e.message);
    }
}, (app) => {
    try {
        const collection = app.findCollectionByNameOrId("users");
        collection.listRule = "id = @request.auth.id";
        collection.viewRule = "id = @request.auth.id";
        app.save(collection);
    } catch(_) {}
});
