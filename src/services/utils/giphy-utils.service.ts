import { giphyService } from '@services/api/giphy/giphy.service';

export class GiphyUtils {
  static async getTrendingGifs(
    setGifs: (gifs: Array<Record<string, unknown>>) => void,
    setLoading: (loading: boolean) => void
  ): Promise<void> {
    setLoading(true);
    try {
      // Add timeout wrapper as backup (Giphy service has its own timeout, but this ensures we don't hang)
      const response = await Promise.race([
        giphyService.trending(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout: Giphy trending fetch took too long')), 35000)
        )
      ]);
      setGifs(response.data.data || []);
      setLoading(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('ECONNABORTED');
      
      if (isLocal || isTimeout) {
        console.error('❌ Error fetching trending GIFs:', errorMessage);
        if (errorMessage.includes('API key is not configured')) {
          console.error('💡 Giphy API key is missing. Please set VITE_GIPHY_API_KEY in your .env file.');
          console.error('   Get an API key from: https://developers.giphy.com/dashboard/');
        } else if (isTimeout) {
          console.error('⏱️ Giphy trending request timed out. This may be due to network issues in the develop environment.');
        }
      }
      setGifs([]);
      setLoading(false);
      // Re-throw error so component can handle it
      throw error;
    }
  }

  static async searchGifs(
    gif: string,
    setGifs: (gifs: Array<Record<string, unknown>>) => void,
    setLoading: (loading: boolean) => void
  ): Promise<void> {
    if (gif.length <= 1) {
      return GiphyUtils.getTrendingGifs(setGifs, setLoading);
    }
    setLoading(true);
    try {
      // Add timeout wrapper as backup (Giphy service has its own timeout, but this ensures we don't hang)
      const response = await Promise.race([
        giphyService.search(gif),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout: Giphy search took too long')), 35000)
        )
      ]);
      setGifs(response.data.data || []);
      setLoading(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('ECONNABORTED');
      
      if (isLocal || isTimeout) {
        console.error('❌ Error searching GIFs:', errorMessage);
        if (errorMessage.includes('API key is not configured')) {
          console.error('💡 Giphy API key is missing. Please set VITE_GIPHY_API_KEY in your .env file.');
          console.error('   Get an API key from: https://developers.giphy.com/dashboard/');
        } else if (isTimeout) {
          console.error('⏱️ Giphy search request timed out. This may be due to network issues in the develop environment.');
        }
      }
      setGifs([]);
      setLoading(false);
      // Re-throw error so component can handle it
      throw error;
    }
  }
}

