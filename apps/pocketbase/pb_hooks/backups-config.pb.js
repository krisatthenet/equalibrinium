/// <reference path="../pb_data/types.d.ts" />

// Configures PocketBase's native scheduled backups on every startup.
//
// PocketBase has built-in cron backups (settings.backups): it dumps pb_data to a
// zip on the schedule, prunes to cronMaxKeep, and — if S3 is configured — uploads
// each backup to an S3-compatible bucket. We reconcile that config here from env
// vars rather than a migration so that (a) no S3 secret is ever committed to git,
// and (b) adding/rotating credentials later is just a Railway env change + restart
// instead of a new migration (a one-time migration would never re-read the env).
//
// Default schedule: daily at 03:00 UTC, keep the last 7 (see PB_BACKUPS_* below).
//
// IMPORTANT: PocketBase's default backup location is pb_data/backups — the SAME
// Railway volume as the live DB, so on-volume-only backups do NOT survive volume
// loss/corruption. Set the S3 env vars below to push backups off-volume (Cloudflare
// R2 / Backblaze B2 / AWS S3) for real disaster recovery. Without them this still
// enables on-volume backups (protects against bad migrations / accidental deletes)
// and logs a warning.
//
// Env vars (set in Railway → workbee-pocketbase service):
//   PB_BACKUPS_CRON                 cron expr (default "0 3 * * *")
//   PB_BACKUPS_KEEP                 max backups to retain (default 7)
//   PB_BACKUPS_S3_BUCKET            S3 bucket name           (required for S3)
//   PB_BACKUPS_S3_ACCESS_KEY        access key id            (required for S3)
//   PB_BACKUPS_S3_SECRET            secret access key        (required for S3)
//   PB_BACKUPS_S3_ENDPOINT          e.g. https://<acct>.r2.cloudflarestorage.com
//   PB_BACKUPS_S3_REGION           region (default "auto"; R2 uses "auto")
//   PB_BACKUPS_S3_FORCE_PATH_STYLE  "true" to force path-style URLs (B2/MinIO)
onBootstrap((e) => {
    e.next();
    try {
        const cron = $os.getenv("PB_BACKUPS_CRON") || "0 3 * * *";
        const keepRaw = parseInt($os.getenv("PB_BACKUPS_KEEP"), 10);
        const cronMaxKeep = Number.isFinite(keepRaw) && keepRaw > 0 ? keepRaw : 7;

        const bucket    = $os.getenv("PB_BACKUPS_S3_BUCKET");
        const accessKey = $os.getenv("PB_BACKUPS_S3_ACCESS_KEY");
        const secret    = $os.getenv("PB_BACKUPS_S3_SECRET");
        const endpoint  = $os.getenv("PB_BACKUPS_S3_ENDPOINT") || "";
        const region    = $os.getenv("PB_BACKUPS_S3_REGION") || "auto";
        const forcePathStyle = ($os.getenv("PB_BACKUPS_S3_FORCE_PATH_STYLE") || "").toLowerCase() === "true";

        const s3Enabled = !!(bucket && accessKey && secret);

        const desiredS3 = {
            enabled: s3Enabled,
            bucket: s3Enabled ? bucket : "",
            region: s3Enabled ? region : "",
            endpoint: s3Enabled ? endpoint : "",
            accessKey: s3Enabled ? accessKey : "",
            secret: s3Enabled ? secret : "",
            forcePathStyle: s3Enabled ? forcePathStyle : false,
        };

        const settings = $app.settings();
        const b = settings.backups;
        const cur = b.s3 || {};

        const changed =
            b.cron !== cron ||
            b.cronMaxKeep !== cronMaxKeep ||
            cur.enabled !== desiredS3.enabled ||
            cur.bucket !== desiredS3.bucket ||
            cur.region !== desiredS3.region ||
            cur.endpoint !== desiredS3.endpoint ||
            cur.accessKey !== desiredS3.accessKey ||
            cur.secret !== desiredS3.secret ||
            cur.forcePathStyle !== desiredS3.forcePathStyle;

        if (!changed) {
            return; // already in the desired state — avoid a write + log on every boot
        }

        settings.backups.cron = cron;
        settings.backups.cronMaxKeep = cronMaxKeep;
        settings.backups.s3 = desiredS3;

        $app.save(settings);

        if (s3Enabled) {
            $app.logger().info(
                "backups configured (S3 off-volume)",
                "cron", cron, "keep", cronMaxKeep, "bucket", bucket, "endpoint", endpoint,
            );
        } else {
            $app.logger().warn(
                "backups configured ON-VOLUME ONLY — set PB_BACKUPS_S3_* env vars for off-volume disaster recovery",
                "cron", cron, "keep", cronMaxKeep,
            );
        }
    } catch (err) {
        $app.logger().error("backups-config failed", "error", err.message);
    }
});
