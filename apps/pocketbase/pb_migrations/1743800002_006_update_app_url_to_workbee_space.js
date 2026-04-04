/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const settings = app.settings();
  settings.meta.appURL = "https://workbee.space";
  app.save(settings);
}, (app) => {
  const settings = app.settings();
  settings.meta.appURL = "https://equalibrinium.com";
  app.save(settings);
});
