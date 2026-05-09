/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("users");

    collection.oauth2 = {
        enabled: true,
        providers: [
            {
                name: "github",
                clientId: process.env.GITHUB_CLIENT_ID || "",
                clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
            }
        ]
    };

    app.save(collection);
}, (app) => {
    const collection = app.findCollectionByNameOrId("users");

    collection.oauth2 = {
        enabled: false,
        providers: []
    };

    app.save(collection);
});
