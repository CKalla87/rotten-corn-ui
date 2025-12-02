import { describe, it, expect, vi } from 'vitest';
import MessageSidebar from '@components/message-sidebar/MessageSidebar';
import { render, screen } from '@root/test.utils';
import userEvent from '@testing-library/user-event';

const messageData = {
  _id: '12345',
  conversationId: '23456',
  receiverId: '1q2w3e4r5t',
  receiverUsername: 'Manny',
  receiverAvatarColor: 'red',
  receiverProfilePicture: 'https://place-hold.i',
  senderUsername: 'Danny',
  senderId: '2w3e4r5t6y',
  senderAvatarColor: 'blue',
  senderProfilePicture: 'https://place-hold.i',
  body: 'This is the message body',
  isRead: false,
  gifUrl: '',
  selectedImage: '',
  reaction: [],
  createdAt: '2022-06-15T12:38:46.867+00:00'
};

describe('MessageSidebar', () => {
  it('should display message notification content', () => {
    const props = {
      profile: { username: 'Danny' },
      messageCount: 1,
      messageNotifications: [messageData, messageData],
      openChatPage: vi.fn()
    };
    render(<MessageSidebar {...props} />);
    const smallElement = screen.getByText('1');
    const infoContainer = screen.getByTestId('info-container');
    expect(smallElement).toBeInTheDocument();
    expect(infoContainer.childElementCount).toEqual(2);
  });

  it('should display message notification content items', () => {
    const props = {
      profile: { username: 'Danny' },
      messageCount: 1,
      messageNotifications: [messageData, messageData],
      openChatPage: vi.fn()
    };
    const { baseElement } = render(<MessageSidebar {...props} />);
    const contentAvatar = baseElement.querySelector('.content-avatar');
    const title = baseElement.querySelector('.title');
    const body = baseElement.querySelector('.subtext');
    const notRead = baseElement.querySelector('.not-read');
    expect(contentAvatar).toBeInTheDocument();
    expect(title).toBeInTheDocument();
    expect(body).toBeInTheDocument();
    expect(notRead).toBeInTheDocument();
    expect(title?.textContent).toEqual('Manny');
    expect(body?.textContent).toEqual('This is the message body');
  });

  it('should handle on click', async () => {
    const user = userEvent.setup();
    const openChatPage = vi.fn();
    const props = {
      profile: { username: 'Danny' },
      messageCount: 1,
      messageNotifications: [messageData, messageData],
      openChatPage
    };
    const { baseElement } = render(<MessageSidebar {...props} />);
    const messageCard = baseElement.querySelectorAll('.message-sub-card');
    await user.click(messageCard[0]);
    expect(openChatPage).toHaveBeenCalledTimes(1);
  });
});

