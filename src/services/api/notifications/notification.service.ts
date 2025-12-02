import axios from '@services/axios';

class NotificationService {
  async getUserNotifications() {
    const response = await axios.get('/notifications');
    return response;
  }

  async markNotificationAsRead(messageId: string) {
    const response = await axios.put(`/notification/${messageId}`);
    return response;
  }

  async deleteNotification(messageId: string) {
    const response = await axios.delete(`/notification/${messageId}`);
    return response;
  }
}

export const notificationService = new NotificationService();

