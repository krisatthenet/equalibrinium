/// <reference path="../pb_data/types.d.ts" />

// Set a 7-day free trial for every new user registration
onRecordAfterCreateSuccess((e) => {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);
  const trialEndStr = trialEnd.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '.000Z');

  e.record.set('trialEndsAt', trialEndStr);
  e.app.save(e.record);
}, 'users');
