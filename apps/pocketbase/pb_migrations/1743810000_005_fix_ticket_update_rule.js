/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId('auction_tickets');
    // Allow: client who owns the ticket, OR authenticated contractor whose accepted bid matches
    collection.updateRule = "@request.auth.id != '' && (clientId = @request.auth.id || @collection.bids.masterId ?= @request.auth.id)";
    app.save(collection);
})
