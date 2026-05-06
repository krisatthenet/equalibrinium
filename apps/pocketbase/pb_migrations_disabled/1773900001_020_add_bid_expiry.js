/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId('bids');

  // Add expiresAt date field
  if (!collection.fields.getByName('expiresAt')) {
    collection.fields.add(new DateField({
      name: 'expiresAt',
      required: false,
    }));
  }

  // Add 'expired' to status select values
  const statusField = collection.fields.getByName('status');
  if (statusField && !statusField.values.includes('expired')) {
    statusField.values.push('expired');
  }

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId('bids');
  collection.fields.removeByName('expiresAt');
  const statusField = collection.fields.getByName('status');
  if (statusField) {
    statusField.values = statusField.values.filter(v => v !== 'expired');
  }
  return app.save(collection);
});
