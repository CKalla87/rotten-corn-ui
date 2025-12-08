import { describe, it, expect, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import { notificationData } from '@mocks/data/notification.mock';
import Notifications from '@pages/social/notifications/Notifications';
import { render, screen, waitFor, act } from '@root/test.utils';
import { notificationService } from '@services/api/notifications/notification.service';
import { NotificationUtils } from '@services/utils/notification-utils.service';
import userEvent from '@testing-library/user-event';

// Mock the notification service
jest.mock('@services/api/notifications/notification.service', () => ({
  notificationService: {
    getUserNotifications: jest.fn(),
    deleteNotification: jest.fn()
  }
}));

// Mock NotificationUtils
jest.mock('@services/utils/notification-utils.service', () => ({
  NotificationUtils: {
    markMessageAsRead: jest.fn().mockImplementation((_id, notification, setNotificationDialogContent) => {
      // Simulate setting the dialog content
      if (setNotificationDialogContent) {
        setNotificationDialogContent({
          post: notification.post || '',
          imgUrl: notification.imgUrl || '',
          comment: notification.comment || '',
          reaction: notification.reaction || '',
          senderName: notification.userFrom?.username || 'Test User'
        });
      }
      return Promise.resolve();
    }),
    socketIONotification: jest.fn().mockImplementation(() => {
      // No-op - don't interfere with state
    })
  }
}));

describe('Notification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (notificationService.getUserNotifications as jest.Mock).mockResolvedValue({
      data: {
        notifications: [notificationData]
      }
    });
  });

  it('should display empty notification message', async () => {
    (notificationService.getUserNotifications as jest.Mock).mockResolvedValueOnce({
      data: {
        notifications: []
      }
    });
    await act(async () => {
      render(<Notifications />);
    });
    // Wait for the async getUserNotifications to complete
    await waitFor(async () => {
      expect(notificationService.getUserNotifications).toHaveBeenCalled();
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    const cardElementItems = screen.queryByTestId('notification-box');
    const emptyPage = await screen.findByTestId('empty-page', {}, { timeout: 3000 });
    expect(cardElementItems).toBeNull();
    expect(emptyPage).toBeInTheDocument();
    expect(emptyPage.textContent).toEqual('You have no notifications');
  });

  it('should have 1 card element item', async () => {
    await act(async () => {
      render(<Notifications />);
    });
    
    // Wait for getUserNotifications to be called and promise to resolve
    await waitFor(async () => {
      expect(notificationService.getUserNotifications).toHaveBeenCalled();
      // Wait a bit for the promise to resolve and state to update
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Wait for the notification boxes to appear after async operation completes
    const cardElementItems = await screen.findAllByTestId('notification-box', {}, { timeout: 5000 });
    expect(cardElementItems.length).toEqual(1);
  });

  it('should show notification preview modal', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<Notifications />);
    });
    // Wait for the async getUserNotifications to complete
    await waitFor(async () => {
      expect(notificationService.getUserNotifications).toHaveBeenCalled();
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    const cardElementItems = await screen.findAllByTestId('notification-box', {}, { timeout: 3000 });
    await user.click(cardElementItems[0]);
    const notificationPreview = await screen.findByTestId('notification-preview', {}, { timeout: 3000 });
    expect(notificationPreview).toBeInTheDocument();
  });

  it('should handle mark as read', async () => {
    const user = userEvent.setup();
    const markMessageAsReadSpy = jest.spyOn(NotificationUtils, 'markMessageAsRead');
    await act(async () => {
      render(<Notifications />);
    });
    // Wait for the async getUserNotifications to complete
    await waitFor(async () => {
      expect(notificationService.getUserNotifications).toHaveBeenCalled();
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    const cardElementItems = await screen.findAllByTestId('notification-box', {}, { timeout: 3000 });
    await user.click(cardElementItems[0]);
    await waitFor(() => {
      expect(markMessageAsReadSpy).toHaveBeenCalledWith(
        notificationData._id,
        expect.objectContaining(notificationData),
        expect.any(Function)
      );
    }, { timeout: 3000 });
  });

  it('should handle delete', async () => {
    const user = userEvent.setup();
    const deleteNotificationSpy = jest.spyOn(notificationService, 'deleteNotification');
    (notificationService.deleteNotification as jest.Mock).mockResolvedValueOnce({
      data: { message: 'Notification deleted' }
    });
    await act(async () => {
      render(<Notifications />);
    });
    // Wait for the async getUserNotifications to complete
    await waitFor(async () => {
      expect(notificationService.getUserNotifications).toHaveBeenCalled();
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    const subtitleElement = await screen.findAllByTestId('subtitle', {}, { timeout: 3000 });
    await user.click(subtitleElement[0]);
    await waitFor(() => {
      expect(deleteNotificationSpy).toHaveBeenCalledWith('12345');
    }, { timeout: 3000 });
  });
});

