import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { find } from 'lodash';
import { getConversationList } from '@redux/api/chat';
import { setSelectedChatUser } from '@redux/reducers/chat/chatSlice';
import { ChatList } from '@components/chat/list';
import { ChatWindow } from '@components/chat/window';
import { chatService } from '@services/api/chat/chat.service';
import { ChatUtils } from '@services/utils/chat-utils.service';
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
  const { profile } = useSelector((state: RootState) => state.user);
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
    
    // If we have both params, try to find user in chatList or create new conversation
    if (username && id) {
      if (chatList.length > 0) {
        const user = find(chatList as ChatUser[], (chat: ChatUser) => {
          const receiverMatch = chat.receiverUsername?.toLowerCase() === username.toLowerCase();
          const senderMatch = chat.senderUsername?.toLowerCase() === username.toLowerCase();
          return receiverMatch || senderMatch;
        });
        
        if (user) {
          dispatch(setSelectedChatUser({ isLoading: false, user: user as unknown as { _id?: string; username?: string; avatarColor?: string; profilePicture?: string; [key: string]: unknown } }));
        } else {
          // User not in chatList - create new conversation entry
          const newUser: ChatUser = {
            receiverId: id,
            receiverUsername: username,
            senderId: profile?._id as string,
            senderUsername: profile?.username as string,
            body: ''
          };
          ChatUtils.joinRoomEvent(newUser, profile || {});
          ChatUtils.clearPrivateChatMessages();
          dispatch(setSelectedChatUser({ isLoading: false, user: newUser as unknown as { _id?: string; username?: string; avatarColor?: string; profilePicture?: string; [key: string]: unknown } }));
          // Add chat users to create the conversation
          if (profile?.username) {
            chatService.addChatUsers({ userOne: profile.username, userTwo: username });
          }
        }
      } else {
        // chatList not loaded yet, but we have params - create temporary user object
        const tempUser: ChatUser = {
          receiverId: id,
          receiverUsername: username,
          senderId: profile?._id as string,
          senderUsername: profile?.username as string,
          body: ''
        };
        ChatUtils.joinRoomEvent(tempUser, profile || {});
        ChatUtils.clearPrivateChatMessages();
        dispatch(setSelectedChatUser({ isLoading: false, user: tempUser as unknown as { _id?: string; username?: string; avatarColor?: string; profilePicture?: string; [key: string]: unknown } }));
        // Add chat users to create the conversation
        if (profile?.username) {
          chatService.addChatUsers({ userOne: profile.username, userTwo: username });
        }
      }
    }
  }, [searchParams, chatList, dispatch, profile]);

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
