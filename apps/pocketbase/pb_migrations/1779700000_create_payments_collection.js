/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    try {
        app.findCollectionByNameOrId("payments");
        console.log("payments collection already exists, skipping");
        return;
    } catch (_) {}

    try {
        const payments = new Collection();
        payments.name = "payments";
        payments.type = "base";

        payments.fields.add(new TextField({    name: "ticketId",      required: true,  max: 15 }));
        payments.fields.add(new TextField({    name: "userId",        required: true,  max: 15 }));
        payments.fields.add(new NumberField({  name: "amount",        required: true }));
        payments.fields.add(new TextField({    name: "paymentMethod", required: false, max: 50 }));
        payments.fields.add(new TextField({    name: "paymentOption", required: false, max: 50 }));
        payments.fields.add(new TextField({    name: "status",        required: false, max: 50 }));
        payments.fields.add(new TextField({    name: "transactionId", required: true,  max: 200 }));

        payments.listRule  = "@request.auth.id = userId";
        payments.viewRule  = "@request.auth.id = userId";
        payments.createRule = "";
        payments.updateRule = "";
        payments.deleteRule = "";

        app.save(payments);
        console.log("payments collection created");
    } catch(e) {
        console.log("create_payments_collection failed: " + e.message);
    }
}, (app) => {
    try {
        const col = app.findCollectionByNameOrId("payments");
        app.delete(col);
    } catch (_) {}
});
