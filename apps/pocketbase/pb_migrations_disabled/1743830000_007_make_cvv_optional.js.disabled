/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId('payment_methods');
    const cvvField = collection.fields.getByName('cvv');
    if (cvvField) {
        cvvField.required = false;
        app.save(collection);
    }
})
