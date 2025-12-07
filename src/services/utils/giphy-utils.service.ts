import { giphyService } from '@services/api/giphy/giphy.service';

export class GiphyUtils {
  static async getTrendingGifs(
    setGifs: (gifs: any[]) => void,
    setLoading: (loading: boolean) => void
  ): Promise<void> {
    setLoading(true);
    try {
      const response = await giphyService.trending();
      setGifs(response.data.data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching trending GIFs:', error.message || error);
      setGifs([]);
      setLoading(false);
    }
  }

  static async searchGifs(
    gif: string,
    setGifs: (gifs: any[]) => void,
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
    } catch (error: any) {
      console.error('Error searching GIFs:', error.message || error);
      setGifs([]);
      setLoading(false);
    }
  }
}

