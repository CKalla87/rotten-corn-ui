import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, createSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { sideBarItems, fontAwesomeIcons } from '@services/utils/static.data';
import { getPosts } from '@redux/api/posts';
import { ChatUtils } from '@services/utils/chat-utils.service';
import { chatService } from '@services/api/chat/chat.service';
import { socketService } from '@services/socket/socket.service';
import { Utils } from '@services/utils/utils.service';
import type { RootState, AppDispatch } from '@redux/store';
import './Sidebar.scss';

interface SidebarProps {
  onNavigate?: () => void;
}

const Sidebar = ({ onNavigate }: SidebarProps) => {
  const { profile } = useSelector((state: RootState) => state.user);
  const { chatList } = useSelector((state: RootState) => state.chat);
  const dispatch = useDispatch<AppDispatch>();
  const [sidebar, setSideBar] = useState<typeof sideBarItems>(sideBarItems);
  const [chatPageName, setChatPageName] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const checkUrl = (name: string) => {
    return location.pathname.includes(name.toLowerCase());
  };

  const navigateToPage = (name: string, url: string) => {
    if (onNavigate) {
      onNavigate();
    }
    if (name === 'Profile') {
      const params: Record<string, string> = {};
      if (profile?._id && typeof profile._id === 'string') {
        params.id = profile._id;
      }
      if (profile?.uId && typeof profile.uId === 'string') {
        params.uId = profile.uId;
      }
      url = `${url}/${profile?.username}?${createSearchParams(params)}`;
    }
    if (name === 'Streams') {
      dispatch(getPosts(1));
    }
    if (name === 'Chat') {
      // Navigate directly to chat/messages without query params
      leaveChatPage();
      setChatPageName('');
      socketService?.socket?.off('message received');
      navigate('/app/social/chat/messages');
      return;
    } else {
      leaveChatPage();
      setChatPageName('');
    }
    socketService?.socket?.off('message received');
    navigate(url);
  };

  interface ChatUserForUtils {
    receiverId?: string;
    receiverUsername?: string;
    senderId?: string;
    senderUsername?: string;
    [key: string]: unknown;
  }

  const createChatUrlParams = useCallback(
    (url: string) => {
      if (chatList.length) {
        const chatUser = chatList[0] as unknown as ChatUserForUtils;
        const params = ChatUtils.chatUrlParams(chatUser, profile || {});
        ChatUtils.joinRoomEvent(chatUser, profile || {});
        return `${url}?${createSearchParams(params)}`;
      }
      return url;
    },
    [chatList, profile]
  );

  const markMessagesAsRead = useCallback(
    async (user: { receiverUsername?: string; senderUsername?: string; receiverId?: string; senderId?: string; isRead?: boolean; [key: string]: unknown }) => {
      try {
        const receiverId = user?.receiverUsername !== profile?.username ? user?.receiverId : user?.senderId;
        if (user?.receiverUsername === profile?.username && !user.isRead) {
          await chatService.markMessagesAsRead(profile?._id as string, receiverId as string);
        }
        const userTwoName = user?.receiverUsername !== profile?.username ? user?.receiverUsername : user?.senderUsername;
        await chatService.addChatUsers({ userOne: profile?.username, userTwo: userTwoName });
      } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
        Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
      }
    },
    [dispatch, profile]
  );

  const leaveChatPage = async () => {
    try {
      const chatUser = (chatList[0] as unknown as { receiverUsername?: string; senderUsername?: string; [key: string]: unknown }) || {};
      const userTwoName =
        chatUser?.receiverUsername !== profile?.username ? chatUser?.receiverUsername : chatUser?.senderUsername;
      ChatUtils.clearPrivateChatMessages();
      await chatService.removeChatUsers({ userOne: profile?.username, userTwo: userTwoName });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setSideBar(sideBarItems);
    }, 0);
  }, []);

  useEffect(() => {
    if (chatPageName === 'Chat') {
      const url = createChatUrlParams('/app/social/chat/messages');
      navigate(url);
      if (chatList.length && !(chatList[0] as { isRead?: boolean }).isRead) {
        markMessagesAsRead(chatList[0] as { receiverUsername?: string; senderUsername?: string; receiverId?: string; senderId?: string; isRead?: boolean; [key: string]: unknown });
      }
    }
  }, [chatList, chatPageName, createChatUrlParams, markMessagesAsRead, navigate]);

  return (
    <div className="app-side-menu">
      <div className="side-menu">
        <ul className="list-unstyled">
          {sidebar.map((data) => (
            <li key={data.index} onClick={() => navigateToPage(data.name, data.url)}>
              <div data-testid="sidebar-list" className={`sidebar-link ${checkUrl(data.name) ? 'active' : ''}`}>
                <div className="menu-icon">{fontAwesomeIcons[data.iconName]}</div>
                <div className="menu-link">
                  <span>{`${data.name}`}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;

