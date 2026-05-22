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
    } catch (err) {
        $app.logger().error("referral: processing failed", "error", err.message, "code", referredByCode);
    }
}, "users");
