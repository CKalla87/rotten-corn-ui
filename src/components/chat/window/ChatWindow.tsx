import { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { some } from 'lodash';
import Avatar from '@components/avatar/Avatar';
import { MessageInput } from '@components/chat/window';
import { MessageDisplay } from '@components/chat/window/message-display';
import { chatService } from '@services/api/chat/chat.service';
import { userService } from '@services/api/user/user.service';
import { ChatUtils } from '@services/utils/chat-utils.service';
import { Utils } from '@services/utils/utils.service';
import useEffectOnce from '@hooks/useEffectOnce';
import type { RootState, AppDispatch } from '@redux/store';
import type { UserProfile } from '@redux/reducers/user/userSlice';
import './ChatWindow.scss';

const ChatWindow = () => {
  const { profile } = useSelector((state: RootState) => state.user);
  const { isLoading } = useSelector((state: RootState) => state.chat);
  const [receiver, setReceiver] = useState<UserProfile | undefined>();
  const [conversationId, setConversationId] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [searchParams] = useSearchParams();
  const [rendered, setRendered] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const getChatMessages = useCallback(
    async (receiverId: string) => {
      try {
        const response = await chatService.getChatMessages(receiverId);
        console.log(response.data.messages);
        ChatUtils.privateChatMessages = [...response.data.messages];
        setChatMessages([...ChatUtils.privateChatMessages]);
      } catch (error: any) {
        Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
      }
    },
    [dispatch]
  );

  const getNewUserMessages = useCallback(() => {
    if (searchParams.get('id') && searchParams.get('username')) {
      setConversationId('');
      setChatMessages([]);
      getChatMessages(searchParams.get('id') || '');
    }
  }, [getChatMessages, searchParams]);

  const getUserProfileByUserId = useCallback(
    async () => {
      try {
        const response = await userService.getUserProfileByUserId(searchParams.get('id') || '');
        setReceiver(response.data.user);
        ChatUtils.joinRoomEvent(response.data.user, profile || {});
      } catch (error: any) {
        Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
      }
    },
    [dispatch, profile, searchParams]
  );

  const sendChatMessage = async (message: string, gifUrl: string, selectedImage: string) => {
    try {
      const checkUserOne = some(
        ChatUtils.chatUsers,
        (user) => user?.userOne === profile?.username && user?.userTwo === receiver?.username
      );
      const checkUserTwo = some(
        ChatUtils.chatUsers,
        (user) => user?.userOne === receiver?.username && user?.userTwo === profile?.username
      );
      const messageData = ChatUtils.messageData({
        receiver,
        conversationId,
        message,
        searchParamsId: searchParams.get('id') || '',
        chatMessages,
        gifUrl,
        selectedImage,
        isRead: checkUserOne && checkUserTwo
      });
      console.log(messageData);
      await chatService.saveChatMessage(messageData);
    } catch (error: any) {
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const updateMessageReaction = async (body: unknown) => {
    try {
      await chatService.updateMessageReaction(body);
    } catch (error: any) {
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const deleteChatMessage = async (senderId: string, receiverId: string, messageId: string, type: string) => {
    try {
      await chatService.markMessageAsDelete(messageId, senderId, receiverId, type);
    } catch (error: any) {
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  useEffectOnce(() => {
    getUserProfileByUserId();
    getNewUserMessages();
  });

  useEffect(() => {
    if (rendered) {
      getUserProfileByUserId();
      getNewUserMessages();
    }
    if (!rendered) setRendered(true);
  }, [getUserProfileByUserId, getNewUserMessages, searchParams, rendered]);

  useEffect(() => {
    if (rendered) {
      ChatUtils.socketIOMessageReceived(chatMessages, searchParams.get('username') || '', setConversationId, setChatMessages);
    }
    if (!rendered) setRendered(true);
    ChatUtils.usersOnline(setOnlineUsers);
    ChatUtils.usersOnChatPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, rendered]);

  useEffect(() => {
    ChatUtils.socketIOMessageReaction(chatMessages, searchParams.get('username') || '', setConversationId, setChatMessages);
  }, [chatMessages, searchParams]);

  return (
    <div className="chat-window-container" data-testid="chatWindowContainer">
      {isLoading ? (
        <div className="message-loading" data-testid="message-loading"></div>
      ) : (
        <div data-testid="chatWindow">
          <div className="chat-title" data-testid="chat-title">
            {receiver && (
              <div className="chat-title-avatar">
                <Avatar
                  name={receiver?.username}
                  bgColor={receiver?.avatarColor}
                  textColor="#ffffff"
                  size={40}
                  avatarSrc={receiver?.profilePicture}
                />
              </div>
            )}
            <div className="chat-title-items">
              <div
                className={`chat-name ${Utils.checkIfUserIsOnline(receiver?.username || '', onlineUsers) ? '' : 'user-not-online'}`}
              >
                {receiver?.username}
              </div>
              {Utils.checkIfUserIsOnline(receiver?.username || '', onlineUsers) && (
                <span className="chat-active">Online</span>
              )}
            </div>
          </div>
          <div className="chat-window">
            <div className="chat-window-message">
              <MessageDisplay
                chatMessages={chatMessages}
                profile={profile}
                updateMessageReaction={updateMessageReaction}
                deleteChatMessage={deleteChatMessage}
              />
            </div>
            <div className="chat-window-input">
              <MessageInput setChatMessage={sendChatMessage} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;

