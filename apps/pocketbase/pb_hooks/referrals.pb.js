/// <reference path="../pb_data/types.d.ts" />

onRecordAfterCreateSuccess(function(e) {
    var user = e.record;

    // Always generate a referral code from the user's ID (8 hex chars, uppercase)
    try {
        var code = user.id.substring(0, 8).toUpperCase();
        user.set("referralCode", code);
        $app.save(user);
    } catch (err) {
        $app.logger().error("referral: set code failed", "error", err.message, "userId", user.id);
    }

    // Process inbound referral — wrapped entirely so it never blocks registration
    var referredByCode = user.getString("referredByCode");
    if (!referredByCode) return;

    try {
        var referrers = $app.findRecordsByFilter(
            "users",
            'referralCode = "' + referredByCode + '"',
            "-created",
            1,
            0
        );
        if (!referrers || referrers.length === 0) {
            $app.logger().warn("referral: code not found", "code", referredByCode);
            return;
        }
        var referrer = referrers[0];

        // Reward referrer: +€10 balance, +30 days on plan
        var currentBalance = Number(referrer.get("balance")) || 0;
        referrer.set("balance", parseFloat((currentBalance + 10).toFixed(2)));

        var expiresStr = referrer.getString("planExpiresAt");
        var baseDate = expiresStr ? new Date(expiresStr) : new Date();
        if (baseDate < new Date()) baseDate = new Date();
        baseDate.setDate(baseDate.getDate() + 30);
        referrer.set("planExpiresAt", baseDate.toISOString());
        $app.save(referrer);

        // Mark referred user: 1 free month on first subscription
        user.set("referralFreeMonths", 1);
        $app.save(user);

        // Record the referral
        try {
            var refCol = $app.findCollectionByNameOrId("referrals");
            var refRec = new Record(refCol);
            refRec.set("referrerId", referrer.id);
            refRec.set("referredId", user.id);
            refRec.set("rewardedAt", new Date().toISOString());
            $app.save(refRec);
        } catch (recErr) {
            $app.logger().error("referral: record save failed", "error", recErr.message);
        }

        $app.logger().info("referral rewarded", "referrer", referrer.id, "referred", user.id);

        // Email the referrer
        try {
            var referrerEmail = referrer.get("email");
            var referrerName  = referrer.get("name") || "there";
            var referredName  = user.get("name")     || "Someone";

            var emailMsg = new MailerMessage({
                from: { address: "kasparas@workbee.space", name: "WorkBee" },
                to:   [{ address: referrerEmail }],
                subject: "You earned €10! " + referredName + " just joined WorkBee 🎉",
                html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0a0a0a;border-radius:12px;border:1px solid #1f1f1f;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="display:inline-block;background:#facc15;color:#000;font-weight:700;font-size:18px;padding:6px 16px;border-radius:9999px;">WorkBee</span>
  </div>
  <h2 style="color:#4ade80;margin-bottom:8px;font-size:22px;">&#127881; Referral reward earned!</h2>
  <p style="color:#e5e5e5;">Hi <strong>${referrerName}</strong>,</p>
  <p style="color:#a3a3a3;"><strong style="color:#e5e5e5;">${referredName}</strong> just joined WorkBee using your referral link.</p>

  <div style="background:#052e16;border-left:4px solid #4ade80;padding:16px;border-radius:8px;margin:20px 0;">
    <p style="margin:0 0 6px 0;color:#4ade80;font-weight:700;font-size:18px;">+&#8364;10 added to your balance</p>
    <p style="margin:0;color:#a3a3a3;font-size:13px;">+30 days added to your current plan</p>
  </div>

  <p style="color:#a3a3a3;">Keep sharing your link to earn more rewards. There's no limit.</p>

  <div style="text-align:center;margin:28px 0;">
    <a href="https://workbee.space/settings?tab=referrals" style="display:inline-block;background:#facc15;color:#000;font-weight:700;font-size:15px;padding:14px 32px;border-radius:9999px;text-decoration:none;">
      View my referrals
    </a>
  </div>
  <p style="color:#525252;font-size:12px;margin-top:32px;border-top:1px solid #1f1f1f;padding-top:16px;">— WorkBee Team</p>
</div>`
            });
            $app.newMailClient().send(emailMsg);
            $app.logger().info("referral email sent", "to", referrerEmail);
        } catch (emailErr) {
            $app.logger().error("referral: email failed", "error", emailErr.message);
        }

    } catch (err) {
        $app.logger().error("referral: processing failed", "error", err.message, "code", referredByCode);
    }
}, "users");
