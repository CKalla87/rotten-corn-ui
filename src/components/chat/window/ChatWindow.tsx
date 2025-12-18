import { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { some } from 'lodash';
import Avatar from '@components/avatar/Avatar';
import { MessageInput } from '@components/chat/window';
import { MessageDisplay } from '@components/chat/window/message-display';
import { chatService } from '@services/api/chat/chat.service';
import { userService } from '@services/api/user/user.service';
import { ChatUtils } from '@services/utils/chat-utils.service';
import { Utils } from '@services/utils/utils.service';
import { setSelectedChatUser } from '@redux/reducers/chat/chatSlice';
import useEffectOnce from '@hooks/useEffectOnce';
import type { RootState, AppDispatch } from '@redux/store';
import type { UserProfile } from '@redux/reducers/user/userSlice';
import './ChatWindow.scss';

const ChatWindow = () => {
  const { profile } = useSelector((state: RootState) => state.user);
  const { isLoading } = useSelector((state: RootState) => state.chat);
  const [receiver, setReceiver] = useState<UserProfile | undefined>();
  const [conversationId, setConversationId] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<Record<string, unknown>>>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [searchParams] = useSearchParams();
  const [rendered, setRendered] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const getChatMessages = useCallback(
    async (receiverId: string) => {
      try {
        const response = await chatService.getChatMessages(receiverId);
        console.log('💬 Chat messages received:', response.data.messages);
        // Log message images for debugging
        response.data.messages?.forEach((msg: Record<string, unknown>, idx: number) => {
          if (msg.selectedImage || msg.gifUrl) {
            console.log(`📷 Message ${idx} image data:`, {
              selectedImage: msg.selectedImage,
              gifUrl: msg.gifUrl,
              body: msg.body,
              receiverId: msg.receiverId,
              senderId: msg.senderId
            });
          }
        });
        ChatUtils.privateChatMessages = [...response.data.messages];
        setChatMessages([...ChatUtils.privateChatMessages]);
      } catch (error: unknown) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
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
      } catch (error: unknown) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
      }
    },
    [dispatch, profile, searchParams]
  );

  const sendChatMessage = async (message: string, gifUrl: string, selectedImage: string) => {
    if (!receiver || !receiver._id) {
      Utils.dispatchNotification('Cannot send message: receiver not selected', 'error', dispatch);
      return;
    }

    if (!message.trim() && !gifUrl && !selectedImage) {
      return;
    }

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
      
      // Validate required fields before sending
      if (!messageData.receiverId || messageData.receiverId.trim() === '') {
        Utils.dispatchNotification('Cannot send message: receiver ID is missing', 'error', dispatch);
        console.error('❌ Missing receiverId. Receiver:', receiver, 'MessageData:', messageData);
        return;
      }
      
      console.log('📤 Sending chat message:', JSON.stringify(messageData, null, 2));
      const response = await chatService.saveChatMessage(messageData);
      console.log('✅ Chat message sent successfully:', response);
    } catch (error: unknown) {
      const axiosError = error as { 
        response?: { 
          status?: number;
          data?: { 
            message?: string;
            error?: string;
            [key: string]: unknown;
          };
        };
        message?: string;
      };
      
      // Log full error details - expand errorData for debugging
      const errorResponse = axiosError?.response?.data;
      console.error('❌ Error sending chat message:', {
        status: axiosError?.response?.status,
        errorMessage: errorResponse?.message || errorResponse?.error || 'Unknown error',
        errorData: JSON.stringify(errorResponse, null, 2),
        fullErrorResponse: errorResponse,
        message: axiosError?.message
      });
      
      const errorMessage = axiosError?.response?.data?.message || 
                          axiosError?.response?.data?.error || 
                          axiosError?.message || 
                          'An error occurred while sending message';
      Utils.dispatchNotification(errorMessage, 'error', dispatch);
    }
  };

  const updateMessageReaction = async (body: unknown) => {
    try {
      await chatService.updateMessageReaction(body);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const deleteChatMessage = async (senderId: string, receiverId: string, messageId: string, type: string) => {
    try {
      await chatService.markMessageAsDelete(messageId, senderId, receiverId, type);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
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
    ChatUtils.usersOnline((data: unknown) => {
      setOnlineUsers(data as string[]);
    });
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
            <button
              className="chat-back-button"
              onClick={() => {
                dispatch(setSelectedChatUser({ isLoading: false, user: null }));
                navigate('/app/social/chat/messages');
              }}
              aria-label="Back to chat list"
            >
              <FaArrowLeft />
            </button>
            {receiver && (
              <div className="chat-title-avatar">
                <Avatar
                  name={receiver?.username}
                  bgColor={receiver?.avatarColor}
                  textColor="#ffffff"
                  size={32}
                  avatarSrc={receiver?.profilePicture || receiver?.avatarImage}
                />
              </div>
            )}
            {receiver && (
              <div className="chat-title-items">
                <div
                  className={`chat-name ${Utils.checkIfUserIsOnline(receiver?.username || '', onlineUsers) ? '' : 'user-not-online'}`}
                >
                  {receiver?.username || ''}
                </div>
                {Utils.checkIfUserIsOnline(receiver?.username || '', onlineUsers) && (
                  <span className="chat-active">Online</span>
                )}
              </div>
            )}
          </div>
          <div className="chat-window">
            <div className="chat-window-message">
              <MessageDisplay
                chatMessages={chatMessages}
                profile={profile || undefined}
                updateMessageReaction={updateMessageReaction}
                deleteChatMessage={deleteChatMessage}
              />
            </div>
            <div className="chat-window-input">
              <MessageInput setChatMessage={(message: string, url?: string, base64File?: string) => {
                sendChatMessage(message, url || '', base64File || '');
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;

