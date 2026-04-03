import express from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Load Google Wallet credentials from file or environment
 * @returns {Object} Credentials object
 */
function loadGoogleWalletCredentials() {
  const credentialsPath = process.env.GOOGLE_WALLET_CREDENTIALS;

  if (!credentialsPath) {
    throw new Error('GOOGLE_WALLET_CREDENTIALS environment variable is not set');
  }

  try {
    // Try to load from file path
    if (credentialsPath.startsWith('/') || credentialsPath.startsWith('.')) {
      const absolutePath = path.resolve(credentialsPath);
      const credentialsJson = fs.readFileSync(absolutePath, 'utf8');
      return JSON.parse(credentialsJson);
    }

    // Try to parse as base64-encoded JSON
    if (credentialsPath.includes('=') || credentialsPath.length > 100) {
      const decoded = Buffer.from(credentialsPath, 'base64').toString('utf8');
      return JSON.parse(decoded);
    }

    // Try to parse as JSON string directly
    return JSON.parse(credentialsPath);
  } catch (error) {
    logger.error('Failed to load Google Wallet credentials:', error.message);
    throw new Error('Invalid Google Wallet credentials configuration');
  }
}

/**
 * POST /google-wallet/create-payment
 * Generate Google Wallet payment token/JWT
 * Request body: { amount, ticketId, paymentOption }
 * Response: { token: string }
 * 
 * Payment options:
 * - "20% Advance": 20% of total amount
 * - "Full with 15% Discount": Full amount with 15% discount applied
 */
router.post('/create-payment', async (req, res) => {
  const { amount, ticketId, paymentOption } = req.body;

  // Validate required fields
  if (!amount || !ticketId || !paymentOption) {
    return res.status(400).json({
      error: 'amount, ticketId, and paymentOption are required',
    });
  }

  // Validate amount is a positive number
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({
      error: 'amount must be a positive number',
    });
  }

  // Validate paymentOption
  const validPaymentOptions = ['20% Advance', 'Full with 15% Discount'];
  if (!validPaymentOptions.includes(paymentOption)) {
    return res.status(400).json({
      error: `paymentOption must be one of: ${validPaymentOptions.join(', ')}`,
    });
  }

  logger.info(`Creating Google Wallet payment token for ticket ${ticketId}, amount ${amount}, option: ${paymentOption}`);

  // Load credentials - throw Error if it fails
  const credentials = loadGoogleWalletCredentials();

  // Calculate payment amount based on option
  let paymentAmount = amount;
  let displayAmount = amount;
  let description = paymentOption;

  if (paymentOption === '20% Advance') {
    paymentAmount = Math.round(amount * 0.2 * 100) / 100;
    displayAmount = paymentAmount;
    description = `20% Advance Payment (${paymentAmount.toFixed(2)} of ${amount.toFixed(2)})`;
  } else if (paymentOption === 'Full with 15% Discount') {
    paymentAmount = Math.round(amount * 0.85 * 100) / 100;
    displayAmount = paymentAmount;
    description = `Full Payment with 15% Discount (${paymentAmount.toFixed(2)} instead of ${amount.toFixed(2)})`;
  }

  // Create JWT payload for Google Wallet
  const payload = {
    iss: credentials.client_email,
    aud: 'google',
    typ: 'savetowallet',
    origins: [process.env.FRONTEND_URL || 'http://localhost:5173'],
    payload: {
      genericObjects: [
        {
          id: `${credentials.project_id}/${ticketId}`,
          classId: `${credentials.project_id}.ticket_class`,
          genericType: 'GENERIC_TYPE_UNSPECIFIED',
          hexBackgroundColor: '#4285F4',
          logo: {
            sourceUri: {
              uri: 'https://www.example.com/logo.png',
            },
          },
          cardTitle: {
            defaultValue: {
              language: 'en-US',
              value: `Payment - ${paymentOption}`,
            },
          },
          subheader: {
            defaultValue: {
              language: 'en-US',
              value: `Amount: $${displayAmount.toFixed(2)}`,
            },
          },
          header: {
            defaultValue: {
              language: 'en-US',
              value: 'Payment Confirmation',
            },
          },
          textModulesData: [
            {
              header: 'Ticket ID',
              body: ticketId,
            },
            {
              header: 'Payment Option',
              body: paymentOption,
            },
            {
              header: 'Amount',
              body: `$${displayAmount.toFixed(2)}`,
            },
            {
              header: 'Merchant ID',
              body: process.env.GOOGLE_MERCHANT_ID || 'BCR2DN4TU7DJNTZC',
            },
          ],
        },
      ],
    },
  };

  // Sign JWT with private key - throw Error if it fails
  const token = jwt.sign(payload, credentials.private_key, {
    algorithm: 'RS256',
    expiresIn: '3600s',
  });

  logger.info(`Google Wallet payment token created for ticket ${ticketId}, amount: $${displayAmount.toFixed(2)}, option: ${paymentOption}`);

  res.json({
    token: token,
    ticketId: ticketId,
    paymentOption: paymentOption,
    originalAmount: amount,
    paymentAmount: displayAmount,
    merchantId: process.env.GOOGLE_MERCHANT_ID || 'BCR2DN4TU7DJNTZC',
  });
});

export default router;