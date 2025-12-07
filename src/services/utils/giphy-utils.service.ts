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
      console.error('Error fetching trending GIFs:', errorMessage);
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
      console.error('Error searching GIFs:', errorMessage);
      setGifs([]);
      setLoading(false);
    }
  }
}

