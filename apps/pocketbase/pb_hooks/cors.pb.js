/// <reference path="../pb_data/types.d.ts" />

routerUse(function(e) {
    var origin = "";
    try { origin = e.request.header.get("Origin"); } catch(_) {}

    if (!origin) {
        e.next();
        return;
    }

    var allowed =
        origin === "https://workbee.space" ||
        origin === "http://localhost:3000" ||
        origin === "http://localhost:3001" ||
        origin === "http://localhost:3002" ||
        origin === "http://localhost:5173" ||
        origin.indexOf(".ngrok-free.dev") !== -1 ||
        origin.indexOf(".ngrok.app") !== -1;

    if (e.request.method === "OPTIONS") {
        if (allowed) {
            e.response.header().set("Access-Control-Allow-Origin", origin);
            e.response.header().set("Access-Control-Allow-Credentials", "true");
            e.response.header().set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
            e.response.header().set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Token");
        }
        e.noContent(204);
        return;
    }

    e.next();

    if (allowed) {
        try {
            e.response.header().set("Access-Control-Allow-Origin", origin);
            e.response.header().set("Access-Control-Allow-Credentials", "true");
            e.response.header().set("Vary", "Origin");
        } catch(_) {}
    }
});
