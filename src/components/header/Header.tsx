import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, createSearchParams } from 'react-router-dom';
import { sumBy } from 'lodash';
import { FaRegBell, FaRegEnvelope, FaCaretDown, FaCaretUp } from 'react-icons/fa';
import logo from '@assets/images/logo.svg';
import Avatar from '@components/avatar/Avatar';
import Dropdown from '@components/dropdown/Dropdown';
import MessageSidebar from '@components/message-sidebar/MessageSidebar';
import HeaderSkeleton from '@components/header/HeaderSkeleton';
import { Utils } from '@services/utils/utils.service';
import { userService } from '@services/api/user/user.service';
import { notificationService } from '@services/api/notifications/notification.service';
import { NotificationUtils } from '@services/utils/notification-utils.service';
import { chatService } from '@services/api/chat/chat.service';
import { ChatUtils } from '@services/utils/chat-utils.service';
import { getConversationList } from '@redux/api/chat';
import useDetectOutsideClick from '@hooks/useDetectOutsideClick';
import useLocalStorage from '@hooks/useLocalStorage';
import useSessionStorage from '@hooks/useSessionStorage';
import useEffectOnce from '@hooks/useEffectOnce';
import type { RootState, AppDispatch } from '@redux/store';
import type { NotificationItem } from '@redux/reducers/notifications/notificationSlice';
import './Header.scss';

interface SettingsItem {
  topText: string;
  subText: string;
  [key: string]: unknown;
}

const Header = () => {
  const { profile } = useSelector((state: RootState) => state.user);
  const { chatList } = useSelector((state: RootState) => state.chat);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageNotifications, setMessageNotifications] = useState<Array<Record<string, unknown>>>([]);
  const [messageCount, setMessageCount] = useState(0);
  const messageRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLUListElement>(null);
  const settingsRef = useRef<HTMLUListElement>(null);
  const [isMessageActive, setIsMessageActive] = useDetectOutsideClick(messageRef as React.RefObject<HTMLElement>, false);
  const [isNotificationActive, setIsNotificationActive] = useDetectOutsideClick(notificationRef as React.RefObject<HTMLElement>, false);
  const [isSettingsActive, setIsSettingsActive] = useDetectOutsideClick(settingsRef as React.RefObject<HTMLElement>, false);
  const [deleteStorageUsername] = useLocalStorage<string>('username', 'delete') as [() => void];
  const [setLoggedIn] = useLocalStorage<boolean>('keepLoggedIn', 'set') as [(value: boolean) => void];
  const [deleteSessionPageReload] = useSessionStorage<boolean>('pageReload', 'delete') as [() => void];

  const getUserNotifications = async () => {
    try {
      const response = await notificationService.getUserNotifications();
      const mappedNotifications = NotificationUtils.mapNotificationDropdownItems(response.data.notifications, setNotificationCount);
      setNotifications(mappedNotifications);
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data && typeof error.response.data.message === 'string' ? error.response.data.message : 'An error occurred';
      Utils.dispatchNotification(errorMessage, 'error', dispatch);
    }
  };

  const onMarkAsRead = (item: NotificationItem | { topText?: string; subText?: string; _id?: string; [key: string]: unknown }) => {
    const notification = item as NotificationItem;
    NotificationUtils.markMessageAsRead(notification?._id || '', notification).catch((error: unknown) => {
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data && typeof error.response.data.message === 'string' ? error.response.data.message : 'An error occurred';
      Utils.dispatchNotification(errorMessage, 'error', dispatch);
    });
  };

  const onDeleteNotification = async (messageId: string) => {
    try {
      const response = await notificationService.deleteNotification(messageId);
      const successMessage = response && typeof response === 'object' && 'data' in response && response.data && typeof response.data === 'object' && 'message' in response.data && typeof response.data.message === 'string' ? response.data.message : 'Notification deleted successfully';
      Utils.dispatchNotification(successMessage, 'success', dispatch);
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data && typeof error.response.data.message === 'string' ? error.response.data.message : 'An error occurred';
      Utils.dispatchNotification(errorMessage, 'error', dispatch);
    }
  };

  const openChatPage = async (notification: Record<string, unknown>) => {
    try {
      const params = ChatUtils.chatUrlParams(notification, profile || {});
      ChatUtils.joinRoomEvent(notification, profile || {});
      ChatUtils.privateChatMessages = [];
      const receiverId = notification?.receiverUsername !== profile?.username ? notification?.receiverId : notification?.senderId;
      if (notification?.receiverUsername === profile?.username && !notification.isRead) {
        await chatService.markMessagesAsRead(profile?._id || '', receiverId as string);
      }
      const userTwoName = notification?.receiverUsername !== profile?.username ? notification?.receiverUsername : notification?.senderUsername;
      await chatService.addChatUsers({ userOne: profile?.username, userTwo: userTwoName });
      navigate(`/app/social/chat/messages?${createSearchParams(params)}`);
      setIsMessageActive(false);
      dispatch(getConversationList());
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const onLogout = async () => {
    try {
      setLoggedIn(false);
      Utils.clearStore({
        dispatch,
        deleteStorageUsername,
        deleteSessionPageReload,
        setLoggedIn
      });
      await userService.logoutUser();
      navigate('/');
    } catch (error: unknown) {
      console.log(error);
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data && typeof error.response.data.message === 'string' ? error.response.data.message : 'An error occurred';
      Utils.dispatchNotification(errorMessage, 'error', dispatch);
    }
  };

  useEffectOnce(() => {
    Utils.mapSettingsDropdownItems(setSettings);
    getUserNotifications();
  });

  useEffect(() => {
    const count = sumBy(chatList, (notification: Record<string, unknown>) => {
      return !notification.isRead && notification.receiverUsername === profile?.username ? 1 : 0;
    });
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setMessageCount(count);
      setMessageNotifications(chatList as Array<Record<string, unknown>>);
    }, 0);
  }, [chatList, profile]);

  useEffect(() => {
    NotificationUtils.socketIONotification(profile, notifications, setNotifications, 'header', setNotificationCount);
    NotificationUtils.socketIOMessageNotification(profile, messageNotifications, setMessageNotifications, setMessageCount, dispatch, window.location);
  }, [profile, notifications, messageNotifications, dispatch]);

  if (!profile) {
    return <HeaderSkeleton />;
  }

  return (
    <>
      {isMessageActive && (
        <div ref={messageRef} onClick={(e) => e.stopPropagation()}>
          <MessageSidebar profile={profile} messageCount={messageCount} messageNotifications={messageNotifications} openChatPage={openChatPage} />
        </div>
      )}
      <div className="header-nav-wrapper" data-testid="header-wrapper">
        <div className="header-navbar">
          <div className="header-image" data-testid="header-image" onClick={() => navigate('/app/social/streams')}>
            <img src={logo} className="img-fluid" alt="" />
          </div>
          <div className="app-name">
            Whisp
          </div>
          <div className="header-menu-toggle">
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </div>
          <ul className="header-nav">
            <li
              className="header-nav-item active-item"
              onClick={(e) => {
                e.stopPropagation();
                setIsMessageActive(false);
                setIsNotificationActive((prev) => !prev);
                setIsSettingsActive(false);
              }}
            >
              <span className="header-list-name">
                <FaRegBell className="header-list-icon" />
                {notificationCount > 0 && (
                  <span className="bg-danger-dots dots" data-testid="notification-dots">
                    {notificationCount}
                  </span>
                )}
              </span>
              {isNotificationActive && (
                <ul className="dropdown-ul dropdown-ul-notifications" ref={notificationRef}>
                  <li className="dropdown-li">
                    <Dropdown
                      height={300}
                      style={{ right: '0', top: '20px' }}
                      data={notifications}
                      notificationCount={notificationCount}
                      title="Notifications"
                      onMarkAsRead={onMarkAsRead}
                      onDeleteNotification={onDeleteNotification}
                    />
                  </li>
                </ul>
              )}
              &nbsp;
            </li>
            <li
              className="header-nav-item active-item"
              onClick={(e) => {
                e.stopPropagation();
                setIsMessageActive((prev) => !prev);
                setIsNotificationActive(false);
                setIsSettingsActive(false);
              }}
            >
              <span className="header-list-name">
                <FaRegEnvelope className="header-list-icon" />
                {messageCount > 0 && (
                  <span className="bg-danger-dots dots" data-testid="messages-dots"></span>
                )}
              </span>
            </li>
            &nbsp;
            <li
              className="header-nav-item"
              onClick={() => {
                setIsSettingsActive(!isSettingsActive);
                setIsMessageActive(false);
                setIsNotificationActive(false);
              }}
            >
              <span className="header-list-name profile-image">
                <Avatar
                  name={profile?.username}
                  bgColor={profile?.avatarColor}
                  textColor="#ffffff"
                  size={40}
                  avatarSrc={profile?.avatarImage}
                />
              </span>
              <span className="header-list-name profile-name">
                {profile?.username || 'Danny'}
                {!isSettingsActive ? (
                  <FaCaretDown className="header-list-icon caret" />
                ) : (
                  <FaCaretUp className="header-list-icon caret" />
                )}
              </span>
              {isSettingsActive && (
                <ul className="dropdown-ul" ref={settingsRef}>
                  <li className="dropdown-li">
                    <Dropdown
                      height={300}
                      style={{ right: '0', top: '20px' }}
                      data={settings}
                      title="Settings"
                      onLogout={onLogout}
                      onNavigate={() => navigate(`/app/social/profile/${profile?.username}`)}
                    />
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Header;

