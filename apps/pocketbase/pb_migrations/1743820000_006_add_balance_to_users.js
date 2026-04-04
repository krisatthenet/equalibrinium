/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId('users');

    const balanceField = new Field({
        type: 'number',
        id: 'number_balance_field',
        name: 'balance',
        required: false,
        min: 0
    });
    collection.fields.add(balanceField);
    app.save(collection);
})
