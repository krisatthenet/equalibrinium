/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId('users');

    const fields = [
        { name: 'payoutMethod', type: 'text' },
        { name: 'bankAccountHolder', type: 'text' },
        { name: 'ibanNumber', type: 'text' },
        { name: 'bicSwift', type: 'text' },
        { name: 'bankName', type: 'text' },
        { name: 'payoutPaypalEmail', type: 'text' },
        { name: 'payoutStripeEmail', type: 'text' },
    ];

    for (const f of fields) {
        const field = new Field({
            type: f.type,
            name: f.name,
            required: false
        });
        collection.fields.add(field);
    }

    app.save(collection);
})
