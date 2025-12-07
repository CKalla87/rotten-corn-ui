import axios from 'axios';

const GIPHY_URL = 'https://api.giphy.com/v1/gifs';
const API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

if (!API_KEY) {
  console.error('VITE_GIPHY_API_KEY is not set in environment variables. Please add it to your .env file.');
}

class GiphyService {
  private validateApiKey(): void {
    if (!API_KEY) {
      throw new Error('Giphy API key is not configured. Please set VITE_GIPHY_API_KEY in your environment variables.');
    }
  }

  async search(query: string) {
    this.validateApiKey();
    const response = await axios.get(`${GIPHY_URL}/search`, {
      params: { api_key: API_KEY, q: query }
    });
    return response;
  }

  async trending() {
    this.validateApiKey();
    const response = await axios.get(`${GIPHY_URL}/trending`, {
      params: { api_key: API_KEY }
    });
    return response;
  }
}

export const giphyService = new GiphyService();

