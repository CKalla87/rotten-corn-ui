import { socketService } from '@services/socket/socket.service';
import { cloneDeep, find, findIndex, remove, sumBy } from 'lodash';
import { Utils } from '@services/utils/utils.service';
import { notificationService } from '@services/api/notifications/notification.service';
import type { NotificationItem } from '@redux/reducers/notifications/notificationSlice';
import type { UserProfile } from '@redux/reducers/user/userSlice';

export class NotificationUtils {
  static socketIONotification(
    profile: UserProfile | null,
    notifications: NotificationItem[],
    setNotifications: (notifications: NotificationItem[]) => void,
    type: string,
    setNotificationsCount?: (count: number) => void
  ): void {
    if (!socketService.socket) return;

    socketService.socket.on('insert notification', (data: NotificationItem[], userToData: { userTo: string }) => {
      if (profile?._id === userToData.userTo) {
        notifications = [...data];
        if (type === 'notificationPage') {
          setNotifications(notifications);
        }
      }
    });

    socketService.socket.on('update notification', (notificationId: string) => {
      notifications = cloneDeep(notifications);
      const notificationData = find(notifications, (notification) => notification._id === notificationId);
      if (notificationData) {
        const index = findIndex(notifications, (notification) => notification._id === notificationId);
        notificationData.read = true;
        notifications.splice(index, 1, notificationData);
        if (type === 'notificationPage') {
          setNotifications(notifications);
        } else {
          const mappedNotifications = NotificationUtils.mapNotificationDropdownItems(notifications, setNotificationsCount);
          setNotifications(mappedNotifications);
        }
      }
    });

    socketService.socket.on('delete notification', (notificationId: string) => {
      notifications = cloneDeep(notifications);
      remove(notifications, { _id: notificationId });
      if (type === 'notificationPage') {
        setNotifications(notifications);
      }
    });
  }

  static mapNotificationDropdownItems(
    notificationData: NotificationItem[],
    setNotificationsCount?: (count: number) => void
  ): NotificationItem[] {
    const items: NotificationItem[] = [];
    for (const notification of notificationData) {
      const topText = notification?.topText ? (notification.topText as string) : notification?.description;
      const imgVersion = notification?.imgVersion as string | undefined;
      const imgId = notification?.imgId as string | undefined;
      const gifUrl = notification?.gifUrl as string | undefined;
      const imgUrl = notification?.imgUrl as string | undefined;
      const item: NotificationItem = {
        _id: notification?._id,
        description: topText || '',
        topText: topText,
        subText: notification?.createdAt as string | undefined,
        createdAt: notification?.createdAt as string | undefined,
        username: notification?.username as string | undefined,
        avatarColor: notification?.avatarColor as string | undefined,
        profilePicture: notification?.profilePicture as string | undefined,
        read: notification?.read,
        post: notification?.post as string | undefined,
        imgUrl: imgId && imgVersion
          ? Utils.appImageUrl(imgVersion, imgId)
          : gifUrl
          ? gifUrl
          : imgUrl,
        comment: notification?.comment as string | undefined,
        reaction: notification?.reaction as string | undefined,
        senderName: notification?.senderName as string | undefined,
        notificationType: notification?.notificationType as string | undefined
      };
      items.push(item);
    }
    const count = sumBy(items, (selectedNotification) => {
      return selectedNotification.read ? 0 : 1;
    });
    if (setNotificationsCount) {
      setNotificationsCount(count);
    }
    return items;
  }

  static async markMessageAsRead(
    messageId: string,
    notification: NotificationItem | null,
    setNotificationDialogContent?: (content: {
      post: string;
      imgUrl: string;
      comment: string;
      reaction: string;
      senderName: string;
    }) => void
  ): Promise<void> {
    try {
      if (notification?.notificationType && notification.notificationType !== 'follows' && setNotificationDialogContent) {
        const imgVersion = notification?.imgVersion as string | undefined;
        const imgId = notification?.imgId as string | undefined;
        const gifUrl = notification?.gifUrl as string | undefined;
        const imgUrl = notification?.imgUrl as string | undefined;
        const post = notification?.post as string | undefined;
        const comment = notification?.comment as string | undefined;
        const reaction = notification?.reaction as string | undefined;
        const username = notification?.username as string | undefined;
        const userFrom = notification?.userFrom as { username?: string } | undefined;
        const notificationDialog = {
          createdAt: notification?.createdAt,
          post: post || '',
          imgUrl: imgId && imgVersion
            ? Utils.appImageUrl(imgVersion, imgId)
            : gifUrl
            ? gifUrl
            : imgUrl || '',
          comment: comment || '',
          reaction: reaction || '',
          senderName: userFrom?.username || username || ''
        };
        setNotificationDialogContent({
          post: notificationDialog.post,
          imgUrl: notificationDialog.imgUrl,
          comment: notificationDialog.comment,
          reaction: notificationDialog.reaction,
          senderName: notificationDialog.senderName
        });
      }
      await notificationService.markNotificationAsRead(messageId);
    } catch (error) {
      console.log(error);
    }
  }

  static socketIOMessageNotification(
    profile: UserProfile | null,
    messageNotifications: Array<Record<string, unknown>>,
    setMessageNotifications: (notifications: Array<Record<string, unknown>>) => void,
    setMessageCount: (count: number) => void,
    _dispatch: unknown,
    location: { pathname: string }
  ): void {
    if (!socketService.socket) return;

    socketService.socket.on('chat list', (data: Record<string, unknown>) => {
      messageNotifications = cloneDeep(messageNotifications);
      if (data?.receiverUsername === profile?.username) {
        const notificationData = {
          senderId: data?.senderId,
          senderUsername: data?.senderUsername,
          senderAvatarColor: data?.senderAvatarColor,
          senderProfilePicture: data?.senderProfilePicture,
          receiverId: data?.receiverId,
          receiverUsername: data?.receiverUsername,
          receiverAvatarColor: data?.receiverAvatarColor,
          receiverProfilePicture: data?.receiverProfilePicture,
          messageId: data?._id,
          conversationId: data?.conversationId,
          body: data?.body,
          isRead: data?.isRead,
          gifUrl: data?.gifUrl,
          selectedImage: data?.selectedImage,
          reaction: data?.reaction,
          createdAt: data?.createdAt
        };
        const messageIndex = findIndex(messageNotifications, (notification) => notification.conversationId === data.conversationId);
        if (messageIndex > -1) {
          remove(messageNotifications, (notification) => notification.conversationId === data.conversationId);
          messageNotifications = [notificationData, ...messageNotifications];
        } else {
          messageNotifications = [notificationData, ...messageNotifications];
        }
        const count = sumBy(messageNotifications, (notification) => {
          return !notification.isRead ? 1 : 0;
        });
        if (!Utils.checkUrl(location.pathname, 'chat')) {
          console.log(count);
        }
        setMessageCount(count);
        setMessageNotifications(messageNotifications);
      }
    });
  }
}

