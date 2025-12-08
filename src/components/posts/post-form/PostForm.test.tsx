import PostForm from '@components/posts/post-form/PostForm';
import { existingUser } from '@mocks/data/user.mock';
import { openModal, toggleGifModal } from '@redux/reducers/modal/modalSlice';
import { addUser } from '@redux/reducers/user/userSlice';
import { store } from '@redux/store';
import { render, screen, within } from '@root/test.utils';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

describe('PostForm', () => {
  beforeEach(() => {
    act(() => {
      store.dispatch(addUser({ token: '123456', profile: existingUser }));
    });
  });

  it('should create post text', () => {
    render(<PostForm />);
    const creatPostText = screen.getByText(/create post/i);
    expect(creatPostText).toBeInTheDocument();
  });

  it('should display avatar', async () => {
    render(<PostForm />);
    const inputBodyElement = await screen.findByTestId('input-body');
    expect(inputBodyElement).toBeInTheDocument();
    expect(inputBodyElement.childNodes.item(0)).toHaveAttribute('src', 'http://place-hold.it/500x500');
    expect(inputBodyElement.childNodes.item(1)).toHaveAttribute('data-placeholder', 'Write something here...');
  });

  it('should open post modal', async () => {
    render(<PostForm />);
    const inputBodyElement = await screen.findByTestId('input-body');
    await userEvent.click(inputBodyElement);
    const postModal = await screen.findByTestId('post-modal');
    expect(postModal).toBeInTheDocument();
  });

  it('should have 4 list items', async () => {
    render(<PostForm />);
    const listElement = await screen.findAllByTestId('list-item');
    expect(listElement[0].childNodes.length).toEqual(4);
  });

  it('should have photo list item', async () => {
    render(<PostForm />);
    const listElement = await screen.findAllByTestId('list-item');
    const { getAllByRole } = within(listElement[0]);
    const items = getAllByRole('listitem');
    await userEvent.click(items[0]);
    const postModal = await screen.findByTestId('post-modal');
    expect(postModal).toBeInTheDocument();
    expect(items[0]).toBeInTheDocument();
    expect(items[0].textContent.trim()).toEqual('Photo');
  });

  it('should have gif list item', async () => {
    act(() => {
      store.dispatch(openModal({ type: 'add' }));
      store.dispatch(toggleGifModal(true));
    });
    render(<PostForm />);
    const listElement = await screen.findAllByTestId('list-item');
    const { getAllByRole } = within(listElement[0]);
    const items = getAllByRole('listitem');
    // Find Gif item by text content instead of index to be more robust
    const gifItem = items.find(item => item.textContent?.trim() === 'Gif');
    expect(gifItem).toBeInTheDocument();
    if (gifItem) {
      await userEvent.click(gifItem);
      const postModal = await screen.findByTestId('post-modal');
      expect(postModal).toBeInTheDocument();
    }
  });

  it('should have Feeling list item', async () => {
    render(<PostForm />);
    const listElement = await screen.findAllByTestId('list-item');
    const { getAllByRole } = within(listElement[0]);
    const items = getAllByRole('listitem');
    // Find Feeling item by text content instead of index to be more robust
    const feelingItem = items.find(item => item.textContent?.trim() === 'Feeling');
    expect(feelingItem).toBeInTheDocument();
    if (feelingItem) {
      await userEvent.click(feelingItem);
      const postModal = await screen.findByTestId('post-modal');
      expect(postModal).toBeInTheDocument();
    }
  });
});


