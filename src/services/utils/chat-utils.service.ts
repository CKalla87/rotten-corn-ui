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
    receiverId: string | undefined;
    receiverUsername: string | undefined;
    receiverAvatarColor: string | undefined;
    receiverProfilePicture: string | undefined;
    body: string;
    isRead: boolean | undefined;
    gifUrl: string | undefined;
    selectedImage: string | undefined;
  } {
    const chatConversationId = find(
      chatMessages,
      (chat) => chat.receiverId === searchParamsId || chat.senderId === searchParamsId
    );

    const messageData = {
      conversationId: chatConversationId ? (chatConversationId.conversationId as string) : (conversationId || ''),
      receiverId: receiver?._id as string | undefined,
      receiverUsername: receiver?.username as string | undefined,
      receiverAvatarColor: receiver?.avatarColor as string | undefined,
      receiverProfilePicture: receiver?.profilePicture as string | undefined,
      body: (message || '').trim(),
      isRead,
      gifUrl,
      selectedImage
    };
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
    chatMessages: ChatUser[],
    username: string,
    setConversationId: (id: string) => void,
    setChatMessages: (messages: ChatUser[]) => void
  ): void {
    let updatedChatMessages = cloneDeep(chatMessages);
    socketService?.socket?.on('message received', (data: ChatUser) => {
      if (
        (data.senderUsername as string)?.toLowerCase() === username?.toLowerCase() ||
        (data.receiverUsername as string)?.toLowerCase() === username?.toLowerCase()
      ) {
        setConversationId(data.conversationId || '');
        ChatUtils.privateChatMessages.push(data);
        updatedChatMessages = [...ChatUtils.privateChatMessages];
        setChatMessages(updatedChatMessages);
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
          updatedChatMessages = [...ChatUtils.privateChatMessages];
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

