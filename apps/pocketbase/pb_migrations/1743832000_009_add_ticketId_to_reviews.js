/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId('reviews');
    const field = new Field({
        type: 'text',
        id: 'text_reviews_ticketid',
        name: 'ticketId',
        required: false
    });
    collection.fields.add(field);
    app.save(collection);
})
