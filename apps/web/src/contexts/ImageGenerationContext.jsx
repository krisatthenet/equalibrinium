import React, { createContext, useContext, useState } from 'react';
import apiServerClient from '@/lib/apiServerClient.js';

const ImageGenerationContext = createContext(null);

export const useImageGeneration = () => {
  const context = useContext(ImageGenerationContext);
  if (!context) {
    throw new Error('useImageGeneration must be used within ImageGenerationProvider');
  }
  return context;
};

export const ImageGenerationProvider = ({ children }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchWithRetry = async (url, options, retries = 3, backoff = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await apiServerClient.fetch(url, options);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        await sleep(backoff * Math.pow(2, i));
      }
    }
  };

  const generateProfileImage = async ({ userType, name, role, interests, style, customPrompt }) => {
    setIsGenerating(true);
    setError(null);
    try {
      const data = await fetchWithRetry('/dalle/generate-profile-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType, name, role, interests, style, customPrompt })
      });
      return data; // Expected: { imageUrl, revisedPrompt }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAndStore = async ({ imageUrl, userId, imageType }) => {
    setIsGenerating(true);
    setError(null);
    try {
      const data = await fetchWithRetry('/dalle/download-and-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, userId, imageType })
      });
      return data; // Expected: { base64, mimeType }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const value = {
    generateProfileImage,
    downloadAndStore,
    isGenerating,
    error
  };

  return (
    <ImageGenerationContext.Provider value={value}>
      {children}
    </ImageGenerationContext.Provider>
  );
};