/// <reference path="../pb_data/types.d.ts" />

routerUse(function(e) {
    var origin = "";
    try { origin = e.request.header.get("Origin") || ""; } catch(_) {}

    if (origin) {
        var allowed = (
            origin === "https://workbee.space" ||
            origin === "https://www.workbee.space" ||
            origin === "https://workbee.lt" ||
            origin === "https://www.workbee.lt" ||
            origin === "http://localhost:3000" ||
            origin === "http://localhost:3001" ||
            origin === "http://localhost:3002" ||
            origin === "http://localhost:5173" ||
            origin.indexOf(".ngrok-free.dev") !== -1 ||
            origin.indexOf(".ngrok.app") !== -1
        );

        if (allowed) {
            e.response.header().set("Access-Control-Allow-Origin", origin);
            e.response.header().set("Access-Control-Allow-Credentials", "true");
            e.response.header().set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
            e.response.header().set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Token");
            e.response.header().set("Vary", "Origin");
        }

        if (e.request.method === "OPTIONS") {
            return e.noContent(204);
        }
    }

    return e.next();
});
