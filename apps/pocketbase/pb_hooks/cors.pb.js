/// <reference path="../pb_data/types.d.ts" />

routerUse((e) => {
    const ALLOWED_ORIGINS = [
        "https://workbee.space",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:5173",
    ];

    const origin = e.request.header.get("Origin");
    if (!origin) return e.next();

    const allowed = ALLOWED_ORIGINS.indexOf(origin) !== -1
        || origin.indexOf(".ngrok-free.dev") !== -1
        || origin.indexOf(".ngrok.app") !== -1;

    if (e.request.method === "OPTIONS") {
        if (allowed) {
            e.response.header().set("Access-Control-Allow-Origin", origin);
            e.response.header().set("Access-Control-Allow-Credentials", "true");
            e.response.header().set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
            e.response.header().set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Token");
        }
        return e.noContent(204);
    }

    const err = e.next();

    if (allowed) {
        e.response.header().set("Access-Control-Allow-Origin", origin);
        e.response.header().set("Access-Control-Allow-Credentials", "true");
        e.response.header().set("Vary", "Origin");
    }

    return err;
});
