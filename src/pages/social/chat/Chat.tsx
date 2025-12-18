import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { find } from 'lodash';
import { getConversationList } from '@redux/api/chat';
import { setSelectedChatUser } from '@redux/reducers/chat/chatSlice';
import { ChatList } from '@components/chat/list';
import { ChatWindow } from '@components/chat/window';
import useEffectOnce from '@hooks/useEffectOnce';
import type { RootState, AppDispatch } from '@redux/store';
import './Chat.scss';

interface ChatUser {
  receiverId?: string;
  receiverUsername?: string;
  senderId?: string;
  senderUsername?: string;
  [key: string]: unknown;
}

const Chat = () => {
  const { selectedChatUser, chatList } = useSelector((state: RootState) => state.chat);
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();

  useEffectOnce(() => {
    dispatch(getConversationList());
    // Clear selected chat on initial mount if no URL params
    const username = searchParams.get('username');
    const id = searchParams.get('id');
    if (!username && !id) {
      dispatch(setSelectedChatUser({ isLoading: false, user: null }));
    }
  });

  // Sync selectedChatUser with URL params for mobile view
  useEffect(() => {
    const username = searchParams.get('username');
    const id = searchParams.get('id');
    
    // Always clear selected chat first when no params
    if (!username && !id) {
      dispatch(setSelectedChatUser({ isLoading: false, user: null }));
      return;
    }
    
    // Only set selected chat if we have both params and chatList is loaded
    if (username && id && chatList.length > 0) {
      const user = find(chatList as ChatUser[], (chat: ChatUser) => {
        const receiverMatch = chat.receiverUsername?.toLowerCase() === username.toLowerCase();
        const senderMatch = chat.senderUsername?.toLowerCase() === username.toLowerCase();
        return receiverMatch || senderMatch;
      });
      
      if (user) {
        dispatch(setSelectedChatUser({ isLoading: false, user: user as unknown as { _id?: string; username?: string; avatarColor?: string; profilePicture?: string; [key: string]: unknown } }));
      } else {
        // Clear if user not found in chatList
        dispatch(setSelectedChatUser({ isLoading: false, user: null }));
      }
    } else if ((username || id) && chatList.length === 0) {
      // Clear if we have params but chatList isn't loaded yet
      dispatch(setSelectedChatUser({ isLoading: false, user: null }));
    }
  }, [searchParams, chatList, dispatch]);

  const hasSelectedChat = !!selectedChatUser;

  return (
    <div className="private-chat-wrapper">
      <div className={`private-chat-wrapper-content ${hasSelectedChat ? 'chat-selected' : ''}`}>
        <div className="private-chat-wrapper-content-side">
          <ChatList />
        </div>
        <div className="private-chat-wrapper-content-conversation">
          {selectedChatUser && <ChatWindow />}
          {!selectedChatUser && (
            <div className="no-chat" data-testid="no-chat">
              Select or Search for users to chat with
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
