import { describe, it, expect, beforeEach, vi } from 'vitest';
import { notificationData } from '@mocks/data/notification.mock';
import Notifications from '@pages/social/notifications/Notifications';
import { render, screen, waitFor } from '@root/test.utils';
import { notificationService } from '@services/api/notifications/notification.service';
import { NotificationUtils } from '@services/utils/notification-utils.service';
import userEvent from '@testing-library/user-event';

// Mock the notification service
vi.mock('@services/api/notifications/notification.service', () => ({
  notificationService: {
    getUserNotifications: vi.fn(),
    deleteNotification: vi.fn()
  }
}));

// Mock NotificationUtils
vi.mock('@services/utils/notification-utils.service', () => ({
  NotificationUtils: {
    markMessageAsRead: vi.fn(),
    socketIONotification: vi.fn()
  }
}));

describe('Notification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (notificationService.getUserNotifications as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        notifications: [notificationData]
      }
    });
  });

  it('should display empty notification message', async () => {
    (notificationService.getUserNotifications as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        notifications: []
      }
    });
    render(<Notifications />);
    const cardElementItems = screen.queryByTestId('notification-box');
    const emptyPage = await screen.findByTestId('empty-page');
    expect(cardElementItems).toBeNull();
    expect(emptyPage).toBeInTheDocument();
    expect(emptyPage.textContent).toEqual('You have no notification');
  });

  it('should have 1 card element item', async () => {
    render(<Notifications />);
    const cardElementItems = await screen.findAllByTestId('notification-box');
    expect(cardElementItems.length).toEqual(1);
  });

  it('should show notification preview modal', async () => {
    const user = userEvent.setup();
    render(<Notifications />);
    const cardElementItems = await screen.findAllByTestId('notification-box');
    await user.click(cardElementItems[0]);
    const notificationPreview = await screen.findByTestId('notification-preview');
    expect(notificationPreview).toBeInTheDocument();
  });

  it('should handle mark as read', async () => {
    const user = userEvent.setup();
    const markMessageAsReadSpy = vi.spyOn(NotificationUtils, 'markMessageAsRead');
    render(<Notifications />);
    const cardElementItems = await screen.findAllByTestId('notification-box');
    await user.click(cardElementItems[0]);
    await waitFor(() => {
      expect(markMessageAsReadSpy).toHaveBeenCalledWith(
        notificationData._id,
        expect.objectContaining(notificationData),
        expect.any(Function)
      );
    });
  });

  it('should handle delete', async () => {
    const user = userEvent.setup();
    const deleteNotificationSpy = vi.spyOn(notificationService, 'deleteNotification');
    (notificationService.deleteNotification as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { message: 'Notification deleted' }
    });
    render(<Notifications />);
    const subtitleElement = await screen.findAllByTestId('subtitle');
    await user.click(subtitleElement[0]);
    await waitFor(() => {
      expect(deleteNotificationSpy).toHaveBeenCalledWith('12345');
    });
  });
});

