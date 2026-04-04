import express from 'express';
import OpenAI from 'openai';
import https from 'https';
import http from 'http';
import logger from '../utils/logger.js';

const router = express.Router();

const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

/**
 * POST /dalle/generate-profile-image
 * Generates a profile image using DALL-E 3
 * Body: { userType, name, role, interests, style, customPrompt }
 * Response: { imageUrl, revisedPrompt }
 */
router.post('/generate-profile-image', async (req, res) => {
  const { userType, name, role, interests, style, customPrompt } = req.body;

  try {
    const openai = getOpenAI();

    let prompt;
    if (customPrompt) {
      prompt = customPrompt;
    } else {
      const parts = ['Professional profile photo,'];
      if (style) parts.push(`${style} style,`);
      if (userType === 'contractor') {
        parts.push('skilled tradesperson or contractor,');
      } else {
        parts.push('person,');
      }
      if (role) parts.push(`working as ${role},`);
      if(interests) parts.push(`interests: ${interests},`);
      if (name) parts.push(`portrait suitable for ${name},`);
      parts.push('high quality, realistic, clean background, professional headshot');
      prompt = parts.join(' ');
    }

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = response.data[0].url;
    const revisedPrompt = response.data[0].revised_prompt || prompt;

    logger.info(`DALL-E image generated for user type: ${userType}`);
    res.json({ imageUrl, revisedPrompt });
  } catch (error) {
    logger.error('DALL-E generation error:', error.message);
    res.status(500).json({ error: error.message || 'Image generation failed' });
  }
});

/**
 * POST /dalle/download-and-store
 * Downloads an image from a URL and returns it as base64
 * Body: { imageUrl, userId, imageType }
 * Response: { base64, mimeType }
 */
router.post('/download-and-store', async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'imageUrl is required' });
  }

  try {
    const base64 = await new Promise((resolve, reject) => {
      const urlObj = new URL(imageUrl);
      const client = urlObj.protocol === 'https:' ? https : http;

      client.get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
        response.on('error', reject);
      }).on('error', reject);
    });

    logger.info('Image downloaded and converted to base64');
    res.json({ base64, mimeType: 'image/png' });
  } catch (error) {
    logger.error('Image download error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to download image' });
  }
});

export default router;
