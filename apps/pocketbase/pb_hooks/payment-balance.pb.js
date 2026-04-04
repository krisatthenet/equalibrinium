/// <reference path="../pb_data/types.d.ts" />

onRecordAfterCreateSuccess((e) => {
    const payment = e.record;
    if (payment.get('status') !== 'completed') return;

    try {
        const ticketId = payment.get('ticketId');
        const amount   = Number(payment.get('amount')) || 0;

        // Find accepted bid for this ticket
        const bids = $app.findAllRecords('bids',
            $dbx.exp('ticketId = {:id} AND status = "accepted"', { id: ticketId })
        );
        if (bids.length === 0) return;

        const contractorId = bids[0].get('masterId');
        const contractor   = $app.findRecordById('users', contractorId);
        const current      = Number(contractor.get('balance')) || 0;

        contractor.set('balance', current + amount);
        $app.save(contractor);

        $app.logger().info('contractor balance updated',
            'contractorId', contractorId,
            'added', amount,
            'newBalance', current + amount
        );
    } catch (err) {
        $app.logger().error('balance update failed', 'error', err.message);
    }
}, 'payments');
