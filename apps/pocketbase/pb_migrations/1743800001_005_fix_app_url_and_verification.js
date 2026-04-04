/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const settings = app.settings();

  // Point to production domain (update for local dev in admin UI if needed)
  settings.meta.appName = "WorkBee";
  settings.meta.appURL = "https://workbee.space";

  // Verification email: link goes to our frontend, not PocketBase admin
  settings.meta.verificationTemplate.subject = "Verify your WorkBee email";
  settings.meta.verificationTemplate.actionUrl = "{APP_URL}/auth/confirm-verification/{TOKEN}";
  settings.meta.verificationTemplate.body = `<p>Hello,</p>
<p>Thank you for registering on WorkBee. Click the button below to verify your email address.</p>
<p><a href="{APP_URL}/auth/confirm-verification/{TOKEN}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Verify Email</a></p>
<p>If the button doesn't work, copy this link into your browser:<br>{APP_URL}/auth/confirm-verification/{TOKEN}</p>
<p>This link expires in 24 hours.</p>
<p>If you did not create an account, you can safely ignore this email.</p>`;

  app.save(settings);
}, (app) => {
  const settings = app.settings();
  settings.meta.appName = "0ff7ee04-bf2c-44c8-b614-e20aef0a5b9f.app-preview.com";
  settings.meta.appURL = "https://0ff7ee04-bf2c-44c8-b614-e20aef0a5b9f.app-preview.com/hcgi/platform";
  app.save(settings);
});
