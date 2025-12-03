import { describe, it, expect } from '@jest/globals';
import '@testing-library/jest-dom';
import Dropdown from '@components/dropdown/Dropdown';
import { render, screen } from '@root/test.utils';
import userEvent from '@testing-library/user-event';

describe('Dropdown', () => {
  it('should display notification content', async () => {
    const user = userEvent.setup();
    const onMarkAsRead = jest.fn();
    const onDeleteNotification = jest.fn();
    const item = {
      _id: '123',
      topText: 'This is a test',
      subText: 'Subtext',
      createdAt: '2022-06-14',
      username: 'Danny',
      avatarColor: 'red',
      profilePicture: 'https://place-hold.it',
      read: false,
      post: 'This is my post',
      imgUrl: '',
      comment: '',
      reaction: '',
      senderName: '',
      notificationType: ''
    };
    const props = {
      data: [item, item, item],
      notificationCount: 1,
      title: 'Notifications',
      style: { right: '250px', top: '20px' },
      height: 300,
      onMarkAsRead,
      onDeleteNotification,
      onLogout: undefined,
      onNavigate: undefined
    };
    const { baseElement } = render(<Dropdown {...props} />);
    const smallElement = screen.getByText('1');
    const infoContainer = screen.getByTestId('info-container');
    const topTextElement = screen.getAllByText('This is a test');
    const trashIcon = baseElement.querySelector('.trash');
    await user.click(topTextElement[0]);
    if (trashIcon) {
      await user.click(trashIcon);
    }
    expect(smallElement).toBeInTheDocument();
    expect(infoContainer.childElementCount).toEqual(3);
    expect(onMarkAsRead).toHaveBeenCalledTimes(1);
    expect(onDeleteNotification).toHaveBeenCalledTimes(1);
  });

  it('should display settings content', async () => {
    const user = userEvent.setup();
    const onLogout = jest.fn();
    const onNavigate = jest.fn();
    const item = {
      _id: '123',
      topText: 'My Profile',
      subText: 'View profile',
      createdAt: '2022-06-14',
      username: 'Danny',
      avatarColor: 'red',
      profilePicture: 'https://place-hold.it'
    };
    const props = {
      data: [item],
      notificationCount: 0,
      title: 'Settings',
      style: { right: '250px', top: '20px' },
      height: 300,
      onMarkAsRead: undefined,
      onDeleteNotification: undefined,
      onLogout,
      onNavigate
    };
    const { baseElement } = render(<Dropdown {...props} />);
    const buttonElement = baseElement.querySelector('.signOut');
    const infoContainer = screen.getByTestId('info-container');
    const topTextElement = screen.getAllByText('My Profile');
    await user.click(topTextElement[0]);
    if (buttonElement) {
      await user.click(buttonElement);
    }
    expect(buttonElement).toBeInTheDocument();
    expect(infoContainer.childElementCount).toEqual(1);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});

