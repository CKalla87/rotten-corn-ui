import { giphyService } from '@services/api/giphy/giphy.service';

export class GiphyUtils {
  static async getTrendingGifs(
    setGifs: (gifs: Array<Record<string, unknown>>) => void,
    setLoading: (loading: boolean) => void
  ): Promise<void> {
    setLoading(true);
    try {
      const response = await giphyService.trending();
      setGifs(response.data.data);
      setLoading(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Error fetching trending GIFs:', errorMessage);
      if (errorMessage.includes('API key is not configured')) {
        console.error('💡 Giphy API key is missing. Please set VITE_GIPHY_API_KEY in your .env file.');
        console.error('   Get an API key from: https://developers.giphy.com/dashboard/');
      }
      setGifs([]);
      setLoading(false);
    }
  }

  static async searchGifs(
    gif: string,
    setGifs: (gifs: Array<Record<string, unknown>>) => void,
    setLoading: (loading: boolean) => void
  ): Promise<void> {
    if (gif.length <= 1) {
      GiphyUtils.getTrendingGifs(setGifs, setLoading);
      return;
    }
    setLoading(true);
    try {
      const response = await giphyService.search(gif);
      setGifs(response.data.data);
      setLoading(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Error searching GIFs:', errorMessage);
      if (errorMessage.includes('API key is not configured')) {
        console.error('💡 Giphy API key is missing. Please set VITE_GIPHY_API_KEY in your .env file.');
        console.error('   Get an API key from: https://developers.giphy.com/dashboard/');
      }
      setGifs([]);
      setLoading(false);
    }
  }
}

