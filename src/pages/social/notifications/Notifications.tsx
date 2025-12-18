import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaCircle, FaRegTrashAlt } from 'react-icons/fa';
import Avatar from '@components/avatar/Avatar';
import { NotificationPreview } from '@components/dialog';
import { Utils } from '@services/utils/utils.service';
import { NotificationUtils } from '@services/utils/notification-utils.service';
import { notificationService } from '@services/api/notifications/notification.service';
import { socketService } from '@services/socket/socket.service';
import { timeAgo } from '@services/utils/timeago.utils';
import type { AppDispatch, RootState } from '@redux/store';
import './Notifications.scss';

interface UserFrom {
  username?: string;
  avatarColor?: string;
  profilePicture?: string;
  [key: string]: unknown;
}

interface Notification {
  _id?: string;
  message?: string;
  topText?: string;
  description?: string;
  userFrom?: UserFrom;
  read?: boolean;
  createdAt?: string;
  post?: string;
  imgId?: string;
  imgVersion?: string;
  gifUrl?: string;
  imgUrl?: string;
  comment?: string;
  reaction?: string;
  senderName?: string;
  notificationType?: string;
  [key: string]: unknown;
}

interface NotificationDialogContent {
  post: string;
  imgUrl: string;
  comment: string;
  reaction: string;
  senderName: string;
}

const Notifications = () => {
  const { profile } = useSelector((state: RootState) => state.user);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationDialogContent, setNotificationDialogContent] = useState<NotificationDialogContent>({
    post: '',
    imgUrl: '',
    comment: '',
    reaction: '',
    senderName: ''
  });
  const dispatch = useDispatch<AppDispatch>();

  // Format notification message with more context
  const formatNotificationMessage = (notification: Notification): string => {
    const username = notification?.userFrom?.username || notification?.senderName || 'Someone';
    const notificationType = notification?.notificationType;
    const message = notification?.message || notification?.description || notification?.topText;
    
    // If we have a custom message, use it
    if (message) {
      return message;
    }
    
    // Otherwise format based on notification type
    switch (notificationType) {
      case 'follows':
        return `${username} is now following you.`;
      case 'comments': {
        const comment = notification?.comment as string | undefined;
        return comment ? `${username} commented: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"` : `${username} commented on your post`;
      }
      case 'reactions': {
        const reaction = notification?.reaction as string | undefined;
        const reactionEmoji: Record<string, string> = {
          love: '❤️',
          like: '👍',
          haha: '😄',
          angry: '😠',
          sad: '😢',
          wow: '😲'
        };
        const reactionText = reaction ? (reactionEmoji[reaction] || reaction) : 'reacted';
        return `${username} ${reactionText} your post`;
      }
      default:
        return `${username} interacted with you`;
    }
  };

  const getUserNotifications = async () => {
    try {
      const response = await notificationService.getUserNotifications();
      if (response?.data?.notifications) {
        // Generate profile picture URLs for each notification
        const notificationsWithUrls = response.data.notifications.map((notification: Notification) => {
          if (notification?.userFrom) {
            const userFrom = notification.userFrom as UserFrom & { profileImageId?: string; profileImageVersion?: string; avatarImageId?: string; avatarImageVersion?: string };
            let profilePicUrl = '';
            
            // Generate URL from image ID/version if available
            if (userFrom.profileImageId && userFrom.profileImageVersion) {
              profilePicUrl = Utils.getImage(userFrom.profileImageId, userFrom.profileImageVersion);
            } else if (userFrom.avatarImageId && userFrom.avatarImageVersion) {
              profilePicUrl = Utils.getImage(userFrom.avatarImageId, userFrom.avatarImageVersion);
            } else if (userFrom.profilePicture) {
              profilePicUrl = userFrom.profilePicture as string;
            }
            
            if (profilePicUrl) {
              // Fix Cloudinary URL if needed
              userFrom.profilePicture = Utils.fixCloudinaryUrl(profilePicUrl);
            }
          }
          return notification;
        });
        setNotifications(notificationsWithUrls);
      } else {
        setNotifications([]);
      }
      setLoading(false);
    } catch (error: unknown) {
      setLoading(false);
      setNotifications([]);
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data && typeof error.response.data.message === 'string' ? error.response.data.message : 'An error occurred';
      Utils.dispatchNotification(errorMessage, 'error', dispatch);
    }
  };

  const markAsRead = async (notification: Notification) => {
    try {
      const notificationItem = {
        ...notification,
        description: notification.description || notification.message || ''
      };
      await NotificationUtils.markMessageAsRead(notification?._id || '', notificationItem, setNotificationDialogContent);
      // Update the notification as read in local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n._id === notification._id ? { ...n, read: true } : n
        )
      );
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data && typeof error.response.data.message === 'string' ? error.response.data.message : 'An error occurred';
      Utils.dispatchNotification(errorMessage, 'error', dispatch);
    }
  };

  const deleteNotification = async (event: React.MouseEvent, messageId: string) => {
    event.stopPropagation();
    try {
      const response = await notificationService.deleteNotification(messageId);
      const successMessage = response && typeof response === 'object' && 'data' in response && response.data && typeof response.data === 'object' && 'message' in response.data && typeof response.data.message === 'string' ? response.data.message : 'Notification deleted successfully';
      Utils.dispatchNotification(successMessage, 'success', dispatch);
      // Remove the notification from the local state
      setNotifications((prevNotifications) => prevNotifications.filter((n) => n._id !== messageId));
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data && typeof error.response.data.message === 'string' ? error.response.data.message : 'An error occurred';
      Utils.dispatchNotification(errorMessage, 'error', dispatch);
    }
  };

  useEffect(() => {
    getUserNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notificationsRef = useRef(notifications);

  // Keep ref in sync with state
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    // Only set up socket listeners after initial load is complete
    if (loading || !profile) {
      return;
    }
    
    // Cleanup function to remove socket listeners
    const cleanup = () => {
      if (socketService.socket) {
        socketService.socket.off('insert notification');
        socketService.socket.off('update notification');
        socketService.socket.off('delete notification');
      }
    };

    // Clean up any existing listeners first
    cleanup();
    
    // Set up socket listeners for real-time updates
    // Use ref to access latest notifications without causing re-renders
    const notificationItems = notificationsRef.current.map((notification) => ({
      ...notification,
      description: notification.description || notification.message || ''
    }));
    
    NotificationUtils.socketIONotification(profile, notificationItems, setNotifications, 'notificationPage');
    
    // Cleanup socket listeners on unmount or when profile/loading changes
    return cleanup;
  }, [loading, profile, setNotifications]);

  return (
    <>
      {notificationDialogContent?.senderName && (
        <NotificationPreview
          title="Your post"
          post={notificationDialogContent?.post}
          imgUrl={notificationDialogContent?.imgUrl}
          comment={notificationDialogContent?.comment}
          reaction={notificationDialogContent?.reaction}
          senderName={notificationDialogContent?.senderName}
          secondButtonText="Close"
          secondBtnHandler={() => {
            setNotificationDialogContent({
              post: '',
              imgUrl: '',
              comment: '',
              reaction: '',
              senderName: ''
            });
          }}
        />
      )}
      <div className="notifications-container">
        <div className="notifications">Notifications</div>
      {notifications.length > 0 && (
        <div className="notifications-box">
          {notifications.map((notification, index) => (
            <div
              key={index}
              data-testid="notification-box"
              className="notification-box"
              onClick={() => markAsRead(notification)}
            >
              <div className="notification-box-sub-card-media">
                <div className="notification-box-sub-card-media-image-icon">
                  <Avatar
                    name={notification?.userFrom?.username || notification?.senderName}
                    bgColor={notification?.userFrom?.avatarColor}
                    textColor="#ffffff"
                    size={40}
                    avatarSrc={notification?.userFrom?.profilePicture ? Utils.fixCloudinaryUrl(notification.userFrom.profilePicture) : undefined}
                  />
                </div>
                <div className="notification-box-sub-card-media-body">
                  <h6 className="title">
                    {formatNotificationMessage(notification)}
                  </h6>
                  <div className="subtitle-body">
                    {!notification?.read && <FaCircle className="icon unread-indicator" />}
                    <p className="subtext">{notification?.createdAt ? timeAgo.transform(notification.createdAt) : 'Just now'}</p>
                  </div>
                </div>
                <div className="notification-icons">
                  <FaRegTrashAlt 
                    className="trash" 
                    onClick={(e) => deleteNotification(e, notification?._id || '')}
                  />
                  {!notification?.read && <FaCircle className="icon unread-indicator-right" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {loading && (
        <div className="notifications-box">
          <div className="empty-page">Loading notifications...</div>
        </div>
      )}
      {!loading && notifications.length === 0 && (
        <h3 className="empty-page" data-testid="empty-page">
          You have no notifications
        </h3>
      )}
      </div>
    </>
  );
};

export default Notifications;
