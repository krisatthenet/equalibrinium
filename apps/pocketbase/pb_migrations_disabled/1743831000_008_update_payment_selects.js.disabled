/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId('payments');

    const methodField = collection.fields.getByName('paymentMethod');
    if (methodField) {
        methodField.values = ['stripe', 'paypal', 'card', 'google_wallet'];
    }

    const optionField = collection.fields.getByName('paymentOption');
    if (optionField) {
        optionField.values = ['full', 'advance_20', 'full_discount'];
    }

    app.save(collection);
})
