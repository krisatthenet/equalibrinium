/// <reference path="../pb_data/types.d.ts" />

const ALLOWED_ORIGINS = [
    "https://workbee.space",
    "http://localhost:3000",
    "http://localhost:5173",
];

routerUse((e) => {
    const origin = e.request.header.get("Origin");
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        e.response.header().set("Access-Control-Allow-Origin", origin);
        e.response.header().set("Access-Control-Allow-Credentials", "true");
        e.response.header().set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        e.response.header().set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Token");
        e.response.header().set("Vary", "Origin");
        if (e.request.method == "OPTIONS") {
            e.noContent(204);
            return;
        }
    }
    return e.next();
});
