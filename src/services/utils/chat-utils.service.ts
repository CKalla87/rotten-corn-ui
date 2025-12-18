import { find, findIndex, cloneDeep, remove } from 'lodash';
import { createSearchParams } from 'react-router-dom';
import { socketService } from '@services/socket/socket.service';
import { chatService } from '@services/api/chat/chat.service';
import type { AppDispatch } from '@redux/store';
import { setSelectedChatUser } from '@redux/reducers/chat/chatSlice';

interface UserData {
  _id?: string;
  username?: string;
  avatarColor?: string;
  profilePicture?: string;
  [key: string]: unknown;
}

interface ChatUser {
  userOne?: string;
  userTwo?: string;
  receiverId?: string;
  receiverUsername?: string;
  senderId?: string;
  senderUsername?: string;
  conversationId?: string;
  _id?: string;
  [key: string]: unknown;
}

interface MessageDataParams {
  receiver?: UserData;
  message?: string;
  searchParamsId?: string;
  conversationId?: string;
  chatMessages?: ChatUser[];
  isRead?: boolean;
  gifUrl?: string;
  selectedImage?: string;
}

interface UpdatedSelectedChatUserParams {
  chatMessageList?: ChatUser[];
  profile?: UserData;
  username?: string;
  setSelectedChatUser?: (user: UserData | null) => void;
  params?: Record<string, string>;
  pathname?: string;
  navigate?: (path: string) => void;
  dispatch?: AppDispatch;
}

export class ChatUtils {
  static privateChatMessages: ChatUser[] = [];
  static chatUsers: ChatUser[] = [];

  static usersOnline(setOnlineUsers: (data: unknown) => void): void {
    socketService?.socket?.on('user online', (data) => {
      setOnlineUsers(data);
    });
  }

  static usersOnChatPage(): void {
    socketService?.socket?.on('add chat users', (data) => {
      ChatUtils.chatUsers = [...data];
    });
  }

  static clearPrivateChatMessages(): void {
    ChatUtils.privateChatMessages = [];
  }

  static joinRoomEvent(user: ChatUser, profile: UserData): void {
    const users = {
      receiverId: user.receiverId,
      receiverName: user.receiverUsername,
      senderId: profile?._id,
      senderName: profile?.username
    };
    socketService?.socket?.emit('join room', users);
  }

  static emitChatPageEvent(event: string, data: unknown): void {
    socketService?.socket?.emit(event, data);
  }

  static chatUrlParams(user: ChatUser, profile: UserData): { username: string; id: string } {
    const params = { username: '', id: '' };
    if (user.receiverUsername === profile?.username) {
      params.username = (user.senderUsername as string)?.toLowerCase() || '';
      params.id = (user.senderId as string) || '';
    } else {
      params.username = (user.receiverUsername as string)?.toLowerCase() || '';
      params.id = (user.receiverId as string) || '';
    }
    return params;
  }

  static messageData({
    receiver,
    message,
    searchParamsId,
    conversationId,
    chatMessages,
    isRead,
    gifUrl,
    selectedImage
  }: MessageDataParams): {
    conversationId: string;
    receiverId: string;
    receiverUsername?: string;
    receiverAvatarColor?: string;
    receiverProfilePicture?: string;
    body: string;
    isRead?: boolean;
    gifUrl?: string;
    selectedImage?: string;
  } {
    const chatConversationId = find(
      chatMessages,
      (chat) => chat.receiverId === searchParamsId || chat.senderId === searchParamsId
    );

    // Build messageData object, only including defined values
    // Ensure receiverId is properly extracted
    const receiverId = receiver?._id;
    if (!receiverId || typeof receiverId !== 'string' || receiverId.trim() === '') {
      throw new Error('Invalid receiver ID: receiver._id must be a non-empty string');
    }

    const messageData: {
      conversationId: string;
      receiverId: string;
      receiverUsername?: string;
      receiverAvatarColor?: string;
      receiverProfilePicture?: string;
      body: string;
      isRead?: boolean;
      gifUrl?: string;
      selectedImage?: string;
    } = {
      conversationId: chatConversationId ? (chatConversationId.conversationId as string) : (conversationId || ''),
      receiverId: receiverId,
      body: (message || '').trim()
    };

    // Only add optional fields if they have values
    if (receiver?.username) {
      messageData.receiverUsername = receiver.username;
    }
    if (receiver?.avatarColor) {
      messageData.receiverAvatarColor = receiver.avatarColor;
    }
    if (receiver?.profilePicture) {
      messageData.receiverProfilePicture = receiver.profilePicture;
    }
    if (typeof isRead === 'boolean') {
      messageData.isRead = isRead;
    }
    if (gifUrl) {
      messageData.gifUrl = gifUrl;
    }
    if (selectedImage) {
      messageData.selectedImage = selectedImage;
    }

    return messageData;
  }

  static updatedSelectedChatUser({
    chatMessageList,
    profile,
    username,
    params,
    pathname,
    navigate,
    dispatch
  }: UpdatedSelectedChatUserParams): void {
    if (chatMessageList && chatMessageList.length > 0) {
      if (dispatch) {
        dispatch(setSelectedChatUser({ isLoading: false, user: chatMessageList[0] as unknown as UserData }));
      }
      if (navigate && pathname && params) {
        navigate(`${pathname}?${createSearchParams(params)}`);
      }
    } else {
      if (dispatch) {
        dispatch(setSelectedChatUser({ isLoading: false, user: null }));
      }
    }

    const sender = find(
      ChatUtils.chatUsers,
      (user) => user.userOne === profile?.username && (user.userTwo as string)?.toLowerCase() === username?.toLowerCase()
    );

    if (sender) {
      chatService.removeChatUsers(sender);
    }
  }

  static socketIOChatList(
    profile: UserData,
    chatMessageList: ChatUser[],
    setChatMessageList: (list: ChatUser[]) => void
  ): void {
    socketService?.socket?.on('chat list', (data: ChatUser) => {
      if (data.senderUsername === profile?.username || data.receiverUsername === profile?.username) {
        const messageIndex = findIndex(chatMessageList, ['conversationId', data.conversationId]);
        let updatedChatMessageList = cloneDeep(chatMessageList);
        if (messageIndex > -1) {
          remove(updatedChatMessageList, (chat) => chat.conversationId === data.conversationId);
          updatedChatMessageList = [data, ...updatedChatMessageList];
        } else {
          remove(updatedChatMessageList, (chat) => chat.receiverUsername === data.receiverUsername);
          updatedChatMessageList = [data, ...updatedChatMessageList];
        }
        setChatMessageList(updatedChatMessageList);
      }
    });
  }

  static socketIOMessageReceived(
    _chatMessages: ChatUser[],
    username: string,
    setConversationId: (id: string) => void,
    setChatMessages: (messages: ChatUser[]) => void
  ): void {
    // Remove existing listeners to prevent duplicates
    socketService?.socket?.off('message received');
    socketService?.socket?.off('message read');
    
    socketService?.socket?.on('message received', (data: ChatUser) => {
      if (
        (data.senderUsername as string)?.toLowerCase() === username?.toLowerCase() ||
        (data.receiverUsername as string)?.toLowerCase() === username?.toLowerCase()
      ) {
        // Check if message already exists to prevent duplicates
        const messageId = data._id || (data as unknown as { _id?: string })._id;
        const messageExists = ChatUtils.privateChatMessages.some(
          (msg) => {
            const msgId = msg._id || (msg as unknown as { _id?: string })._id;
            return msgId === messageId;
          }
        );
        
        if (!messageExists) {
          setConversationId(data.conversationId || '');
          ChatUtils.privateChatMessages.push(data);
          const updatedChatMessages = [...ChatUtils.privateChatMessages];
          setChatMessages(updatedChatMessages);
        }
      }
    });

    socketService?.socket?.on('message read', (data: ChatUser & { _id?: string }) => {
      if (
        (data.senderUsername as string)?.toLowerCase() === username?.toLowerCase() ||
        (data.receiverUsername as string)?.toLowerCase() === username?.toLowerCase()
      ) {
        const findMessageIndex = findIndex(ChatUtils.privateChatMessages, ['_id', data._id]);
        if (findMessageIndex > -1) {
          ChatUtils.privateChatMessages.splice(findMessageIndex, 1, data);
          const updatedChatMessages = [...ChatUtils.privateChatMessages];
          setChatMessages(updatedChatMessages);
        }
      }
    });
  }

  static socketIOMessageReaction(
    chatMessages: ChatUser[],
    username: string,
    setConversationId: (id: string) => void,
    setChatMessages: (messages: ChatUser[]) => void
  ): void {
    socketService?.socket?.on('message reaction', (data: ChatUser) => {
      if (
        (data.senderUsername as string)?.toLowerCase() === username?.toLowerCase() ||
        (data.receiverUsername as string)?.toLowerCase() === username?.toLowerCase()
      ) {
        const updatedChatMessages = cloneDeep(chatMessages);
        setConversationId(data.conversationId || '');
        const messageIndex = findIndex(updatedChatMessages, (message) => (message as ChatUser & { _id?: string })?._id === (data as ChatUser & { _id?: string })?._id);
        if (messageIndex > -1) {
          updatedChatMessages[messageIndex] = data;
          setChatMessages(updatedChatMessages);
        }
      }
    });
  }
}

