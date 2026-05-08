/// <reference path="../pb_data/types.d.ts" />

onRecordAfterCreateSuccess(function(e) {
    var user = e.record;

    // Always generate a referral code from the user's ID
    try {
        var code = user.id.substring(0, 8).toUpperCase();
        user.set("referralCode", code);
        $app.save(user);
    } catch (err) {
        $app.logger().error("referral: failed to set referral code", "error", err.message, "userId", user.id);
    }

    // Process inbound referral
    var referredByCode = user.getString("referredByCode");
    if (!referredByCode) return;

    try {
        var referrers = $app.findRecordsByFilter(
            "users",
            "referralCode = {:code}",
            "",
            1,
            0,
            { code: referredByCode }
        );
        if (!referrers || referrers.length === 0) {
            $app.logger().warn("referral: code not found", "code", referredByCode);
            return;
        }
        var referrer = referrers[0];

        // --- Reward referrer: +€10 balance, +30 days plan ---
        var currentBalance = parseFloat(referrer.getString("balance")) || 0;
        referrer.set("balance", parseFloat((currentBalance + 10).toFixed(2)));

        var expiresStr = referrer.getString("planExpiresAt");
        var baseDate = expiresStr ? new Date(expiresStr) : new Date();
        if (baseDate < new Date()) baseDate = new Date();
        baseDate.setDate(baseDate.getDate() + 30);
        referrer.set("planExpiresAt", baseDate.toISOString());

        $app.save(referrer);

        // --- Reward referred user: 1 free month on first subscription ---
        user.set("referralFreeMonths", 1);
        $app.save(user);

        // --- Record referral ---
        try {
            var refCollection = $app.findCollectionByNameOrId("referrals");
            var refRecord = new Record(refCollection);
            refRecord.set("referrerId", referrer.id);
            refRecord.set("referredId", user.id);
            refRecord.set("rewardedAt", new Date().toISOString());
            $app.save(refRecord);
        } catch (recErr) {
            $app.logger().error("referral: failed to create referral record", "error", recErr.message);
        }

        $app.logger().info(
            "referral rewarded",
            "referrer", referrer.id,
            "referred", user.id,
            "code", referredByCode
        );
    } catch (err) {
        $app.logger().error("referral: processing failed", "error", err.message, "code", referredByCode);
    }
}, "users");
