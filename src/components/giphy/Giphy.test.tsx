import Giphy from '@components/giphy/Giphy';
import { fireEvent, render, screen, waitFor, within } from '@root/test.utils';
import { GiphyUtils } from '@services/utils/giphy-utils.service';

const url =
  'https://media1.giphy.com/media/qg5pk8s2h5kJy/giphy.gif?cid=b6f691b6xs6w6z065eld5ihx7moh2xlo0fyofdhij5zp9xn4&rid=giphy.gif&ct=g';

describe('Giphy', () => {
  it('should display trending gifs', async () => {
    render(<Giphy />);
    const listElement = screen.getByRole('list');
    const { getAllByRole } = within(listElement);
    const listItemElements = await screen.findAllByTestId('list-item');
    expect(listItemElements.length).toEqual(1);
    const imgElement = screen.getByRole('img');
    expect(imgElement).toHaveAttribute('src', url);
    await waitFor(() => expect(getAllByRole('listitem').length).toBeGreaterThan(0));
  });

  it('should call search input', async () => {
    jest.spyOn(GiphyUtils, 'searchGifs');
    render(<Giphy />);
    const inputElement = screen.getByPlaceholderText('Search Gif');
    fireEvent.change(inputElement, { target: { value: 'dog' } });
    const listItemElements = await screen.findAllByTestId('list-item');
    expect(listItemElements.length).toEqual(1);
    const imgElement = screen.getByRole('img');
    expect(imgElement).toHaveAttribute('src', url);
    expect(GiphyUtils.searchGifs).toHaveBeenCalledTimes(1);
  });

  it('should return empty search result', async () => {
    jest.spyOn(GiphyUtils, 'getTrendingGifs').mockResolvedValue(undefined);
    render(<Giphy />);
    const inputElement = screen.getByPlaceholderText('Search Gif');
    fireEvent.change(inputElement, { target: { value: '.....' } });
    await waitFor(() => {
      const listItemElements = screen.queryAllByTestId('list-item');
      expect(listItemElements.length).toEqual(0);
    });
  });
});

