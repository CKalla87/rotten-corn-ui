import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaCircle, FaRegCircle, FaRegTrashAlt } from 'react-icons/fa';
import Avatar from '@components/avatar/Avatar';
import { NotificationPreview } from '@components/dialog';
import { Utils } from '@services/utils/utils.service';
import { NotificationUtils } from '@services/utils/notification-utils.service';
import { notificationService } from '@services/api/notifications/notification.service';
import useEffectOnce from '@hooks/useEffectOnce';
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

  const getUserNotifications = async () => {
    try {
      const response = await notificationService.getUserNotifications();
      setNotifications(response.data.notifications);
      setLoading(false);
    } catch (error: unknown) {
      setLoading(false);
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
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data && typeof error.response.data.message === 'string' ? error.response.data.message : 'An error occurred';
      Utils.dispatchNotification(errorMessage, 'error', dispatch);
    }
  };

  useEffectOnce(() => {
    getUserNotifications();
  });

  useEffect(() => {
    const notificationItems = notifications.map((notification) => ({
      ...notification,
      description: notification.description || notification.message || ''
    }));
    NotificationUtils.socketIONotification(profile, notificationItems, setNotifications, 'notificationPage');
  }, [profile, notifications]);

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
              <div className="notification-box-sub-card">
                <div className="notification-box-sub-card-media">
                  <div className="notification-box-sub-card-media-image-icon">
                    <Avatar
                      name={notification?.userFrom?.username}
                      bgColor={notification?.userFrom?.avatarColor}
                      textColor="#ffffff"
                      size={40}
                      avatarSrc={notification?.userFrom?.profilePicture}
                    />
                  </div>
                </div>
                <div className="notification-box-sub-card-media-body">
                  <h6 className="title">
                    {notification?.message}
                    <small data-testid="subtitle" className="subtitle" onClick={(e) => deleteNotification(e, notification?._id || '')}>
                      <FaRegTrashAlt className="trash" />
                    </small>
                  </h6>
                  <div className="subtitle-body">
                    <small className="subtitle">
                      {!notification?.read ? <FaCircle className="icon" /> : <FaRegCircle className="icon" />}
                    </small>
                    <p className="subtext">1 hr ago</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {loading && !notifications.length && <div className="notifications-box"></div>}
      {!loading && !notifications.length && (
        <h3 className="empty-page" data-testid="empty-page">
          You have no notification
        </h3>
      )}
      </div>
    </>
  );
};

export default Notifications;
