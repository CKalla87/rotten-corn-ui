import axios from 'axios';

const GIPHY_URL = 'https://api.giphy.com/v1/gifs';
// Handle import.meta which may not be available in test environment
let API_KEY = '';
try {
  // Type-safe check for import.meta in both Vite and Jest environments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const importMeta = (globalThis as any).import?.meta || (typeof (globalThis as any).import !== 'undefined' && (globalThis as any).import.meta);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = importMeta?.env as any;
  if (env?.VITE_GIPHY_API_KEY) {
    API_KEY = env.VITE_GIPHY_API_KEY;
  }
} catch (error) {
  // In test environment, API_KEY will be empty string
  API_KEY = '';
  console.error('Error reading Giphy API key:', error);
}

// Log API key status for debugging (but don't log the actual key)
if (!API_KEY) {
  console.error('❌ VITE_GIPHY_API_KEY is not set in environment variables.');
  console.error('   Get an API key from: https://developers.giphy.com/dashboard/');
  console.error('   Then add: VITE_GIPHY_API_KEY=your-key-here to your .env file');
  console.error('   ⚠️ IMPORTANT: You MUST restart your dev server (npm run dev) after adding the key!');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const importMeta = (globalThis as any).import?.meta || (typeof (globalThis as any).import !== 'undefined' && (globalThis as any).import.meta);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = importMeta?.env as any;
  const keyStatus = env?.VITE_GIPHY_API_KEY ? 'exists but empty' : 'undefined';
  console.error('   Current VITE_GIPHY_API_KEY:', keyStatus);
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

