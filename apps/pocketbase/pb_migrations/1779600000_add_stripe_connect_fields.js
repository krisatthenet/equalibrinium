/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    try {
        const collection = app.findCollectionByNameOrId("users");

        const fields = [
            { name: "stripeAccountId", ctor: TextField,  opts: { required: false, max: 100 } },
            { name: "stripeOnboarded", ctor: BoolField,  opts: { required: false } },
            { name: "balance",         ctor: NumberField, opts: { required: false } },
        ];

        let changed = false;
        for (const { name, ctor, opts } of fields) {
            if (collection.fields.getByName(name)) continue;
            collection.fields.add(new ctor({ name, ...opts }));
            changed = true;
        }

        if (changed) {
            app.save(collection);
            console.log("Stripe Connect fields added to users");
        }
    } catch(e) {
        console.log("add_stripe_connect_fields skipped: " + e.message);
    }
}, (app) => {
    try {
        const collection = app.findCollectionByNameOrId("users");
        for (const name of ["stripeAccountId", "stripeOnboarded", "balance"]) {
            try { collection.fields.removeByName(name); } catch (_) {}
        }
        app.save(collection);
    } catch (_) {}
});
