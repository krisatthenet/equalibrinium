/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    name: 'push_subscriptions',
    type: 'base',
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
    fields: [
      { type: 'text', name: 'userId', required: true },
      { type: 'text', name: 'endpoint', required: true },
      { type: 'text', name: 'p256dh', required: true },
      { type: 'text', name: 'auth', required: true },
    ],
  });
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId('push_subscriptions');
  return app.delete(collection);
});
