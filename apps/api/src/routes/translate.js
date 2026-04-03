import express from 'express';
import pkg from '@google-cloud/translate';
const { Translate } = pkg;
import logger from '../utils/logger.js';

const router = express.Router();

// Initialize Google Translate client once at module level
const translate = new Translate({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
});

/**
 * POST /translate
 * Translate text using Google Translate API
 * Request body: { text, targetLanguage, sourceLanguage? }
 * Response: { originalText, translatedText, sourceLanguage, targetLanguage }
 */
router.post('/', async (req, res) => {
  const { text, targetLanguage, sourceLanguage } = req.body;

  // Validate required fields
  if (!text || !targetLanguage) {
    return res.status(400).json({
      error: 'Text and targetLanguage are required',
    });
  }

  try {
    const options = sourceLanguage ? { from: sourceLanguage, to: targetLanguage } : targetLanguage;
    const [translations] = await translate.translate(text, options);
    const translatedText = Array.isArray(translations) ? translations[0] : translations;

    logger.info(`Translation completed: ${sourceLanguage || 'auto'} -> ${targetLanguage}`);

    res.json({
      originalText: text,
      translatedText,
      sourceLanguage: sourceLanguage || 'auto',
      targetLanguage,
    });
  } catch (error) {
    logger.error('Translation error:', error.message);
    throw error;
  }
});

export default router;
