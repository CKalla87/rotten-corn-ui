import Giphy from '@components/giphy/Giphy';
import { fireEvent, render, screen, waitFor, within, act } from '@root/test.utils';
import { GiphyUtils } from '@services/utils/giphy-utils.service';

const url =
  'https://media1.giphy.com/media/qg5pk8s2h5kJy/giphy.gif?cid=b6f691b6xs6w6z065eld5ihx7moh2xlo0fyofdhij5zp9xn4&rid=giphy.gif&ct=g';

// Mock GiphyUtils
jest.mock('@services/utils/giphy-utils.service', () => ({
  GiphyUtils: {
    getTrendingGifs: jest.fn(),
    searchGifs: jest.fn()
  }
}));

const mockGifData = [
  {
    images: {
      original: {
        url: url
      }
    }
  }
];

describe('Giphy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display trending gifs', async () => {
    (GiphyUtils.getTrendingGifs as jest.Mock).mockImplementation((setGifs) => {
      setGifs(mockGifData);
    });
    render(<Giphy />);
    const listItemElements = await screen.findAllByTestId('list-item', {}, { timeout: 3000 });
    expect(listItemElements.length).toEqual(1);
    const imgElement = listItemElements[0].querySelector('img');
    expect(imgElement).toBeInTheDocument();
    expect(imgElement).toHaveAttribute('src', url);
    const listElement = screen.getByRole('list');
    const { getAllByRole } = within(listElement);
    await waitFor(() => expect(getAllByRole('listitem').length).toBeGreaterThan(0));
  });

  it('should call search input', async () => {
    (GiphyUtils.getTrendingGifs as jest.Mock).mockImplementation((setGifs) => {
      setGifs([]);
    });
    (GiphyUtils.searchGifs as jest.Mock).mockImplementation((_searchTerm, setGifs) => {
      setGifs(mockGifData);
    });
    render(<Giphy />);
    const inputElement = screen.getByPlaceholderText('Search Gif');
    
    await act(async () => {
      fireEvent.change(inputElement, { target: { value: 'dog' } });
      // Wait for debounce (500ms) + buffer
      await new Promise(resolve => setTimeout(resolve, 600));
    });
    
    // Wait for the search to be called
    await waitFor(() => {
      expect(GiphyUtils.searchGifs).toHaveBeenCalled();
    }, { timeout: 3000 });
    
    // Wait for the list items to appear after search completes
    const listItemElements = await screen.findAllByTestId('list-item', {}, { timeout: 3000 });
    expect(listItemElements.length).toEqual(1);
    const imgElement = listItemElements[0].querySelector('img');
    expect(imgElement).toBeInTheDocument();
    expect(imgElement).toHaveAttribute('src', url);
    expect(GiphyUtils.searchGifs).toHaveBeenCalledTimes(1);
  });

  it('should return empty search result', async () => {
    (GiphyUtils.getTrendingGifs as jest.Mock).mockImplementation((setGifs) => {
      setGifs([]);
    });
    (GiphyUtils.searchGifs as jest.Mock).mockImplementation((_searchTerm, setGifs) => {
      setGifs([]);
    });
    render(<Giphy />);
    const inputElement = screen.getByPlaceholderText('Search Gif');
    
    await act(async () => {
      fireEvent.change(inputElement, { target: { value: '.....' } });
      // Wait for debounce (500ms) + buffer
      await new Promise(resolve => setTimeout(resolve, 600));
    });
    
    // Wait for the search to be called
    await waitFor(() => {
      expect(GiphyUtils.searchGifs).toHaveBeenCalled();
    }, { timeout: 3000 });
    
    // Verify no items appear
    await waitFor(() => {
      const listItemElements = screen.queryAllByTestId('list-item');
      expect(listItemElements.length).toEqual(0);
    }, { timeout: 3000 });
  });
});

