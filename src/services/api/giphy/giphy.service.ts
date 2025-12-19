import axios from 'axios';

const GIPHY_URL = 'https://api.giphy.com/v1/gifs';

// Get API key from environment - Vite exposes import.meta.env
// Similar pattern to axios.ts for consistency
const getApiKey = (): string => {
  // Check runtime injection first (from window.__ENV__) - for hosted environments
  if (typeof window !== 'undefined' && window.__ENV__?.VITE_GIPHY_API_KEY) {
    return window.__ENV__.VITE_GIPHY_API_KEY;
  }
  
  // Fall back to build-time environment variables (Vite)
  // This works in Vite runtime - tests should mock this module
  return import.meta.env.VITE_GIPHY_API_KEY || '';
};

const API_KEY = getApiKey();

// Log API key status for debugging (but don't log the actual key)
if (!API_KEY) {
  console.error('❌ VITE_GIPHY_API_KEY is not set in environment variables.');
  console.error('   Get an API key from: https://developers.giphy.com/dashboard/');
  console.error('   Then add: VITE_GIPHY_API_KEY=your-key-here to your .env file');
  console.error('   ⚠️ IMPORTANT: You MUST restart your dev server (npm run dev) after adding the key!');
} else {
  console.log('✅ Giphy API key is configured (key length:', API_KEY.length, 'characters)');
  console.log('   Key starts with:', API_KEY.substring(0, 4) + '...');
}

class GiphyService {
  private validateApiKey(): void {
    if (!API_KEY) {
      throw new Error('Giphy API key is not configured. Please set VITE_GIPHY_API_KEY in your environment variables.');
    }
  }

  async search(query: string) {
    this.validateApiKey();
    console.log('🔍 Searching Giphy for:', query);
    try {
      const response = await axios.get(`${GIPHY_URL}/search`, {
        params: { api_key: API_KEY, q: query, limit: 50 }
      });
      console.log('✅ Giphy search successful, found', response.data.data?.length || 0, 'GIFs');
      return response;
    } catch (error) {
      console.error('❌ Giphy search error:', error);
      throw error;
    }
  }

  async trending() {
    this.validateApiKey();
    console.log('📊 Fetching trending GIFs from Giphy');
    try {
      const response = await axios.get(`${GIPHY_URL}/trending`, {
        params: { api_key: API_KEY, limit: 50 }
      });
      console.log('✅ Giphy trending fetch successful, found', response.data.data?.length || 0, 'GIFs');
      return response;
    } catch (error) {
      console.error('❌ Giphy trending error:', error);
      throw error;
    }
  }
}

export const giphyService = new GiphyService();

