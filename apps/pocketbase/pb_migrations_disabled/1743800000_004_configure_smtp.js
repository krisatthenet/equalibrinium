/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    let settings = app.settings()

    settings.smtp.enabled = true
    settings.smtp.host = "smtp.hostinger.com"
    settings.smtp.port = 465
    settings.smtp.username = "kasparas@workbee.space"
    settings.smtp.password = "Frenkis123!"
    settings.smtp.authMethod = "LOGIN"
    settings.smtp.tls = true

    settings.meta.senderName = "WorkBee"
    settings.meta.senderAddress = "kasparas@workbee.space"

    app.save(settings)
})
