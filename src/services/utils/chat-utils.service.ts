import { find, findIndex, cloneDeep, remove } from 'lodash';
import { createSearchParams } from 'react-router-dom';
import { socketService } from '@services/socket/socket.service';
import React from 'react';
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
    
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    socketService?.socket?.on('message received', (data: ChatUser) => {
      const senderUsername = (data.senderUsername as string)?.toLowerCase() || '';
      const receiverUsername = (data.receiverUsername as string)?.toLowerCase() || '';
      const currentUsername = username?.toLowerCase() || '';
      
      if (isLocal) {
        console.log('📨 Message received event:', {
          senderUsername,
          receiverUsername,
          currentUsername,
          matchesSender: senderUsername === currentUsername,
          matchesReceiver: receiverUsername === currentUsername,
          messageId: data._id,
          body: data.body
        });
      }
      
      // Check if message is for current user (either as sender or receiver)
      if (senderUsername === currentUsername || receiverUsername === currentUsername) {
        // Check if message already exists to prevent duplicates
        const messageId = data._id || (data as unknown as { _id?: string })._id;
        const messageExists = ChatUtils.privateChatMessages.some(
          (msg) => {
            const msgId = msg._id || (msg as unknown as { _id?: string })._id;
            return msgId === messageId;
          }
        );
        
        if (isLocal) {
          console.log('📨 Message processing:', {
            messageId,
            messageExists,
            currentMessagesCount: ChatUtils.privateChatMessages.length
          });
        }
        
        if (!messageExists) {
          // Check if there's a temporary optimistic message that should be replaced
          // Match by sender, receiver, body, and timestamp (within 5 seconds)
          const tempMessageIndex = ChatUtils.privateChatMessages.findIndex((msg) => {
            const msgId = msg._id as string;
            if (!msgId?.startsWith('temp-')) return false;
            
            const senderMatch = (msg.senderId as string) === (data.senderId as string) ||
                               ((msg.senderUsername as string)?.toLowerCase() === senderUsername);
            const receiverMatch = (msg.receiverId as string) === (data.receiverId as string) ||
                                 ((msg.receiverUsername as string)?.toLowerCase() === receiverUsername);
            const bodyMatch = (msg.body as string) === (data.body as string);
            
            return senderMatch && receiverMatch && bodyMatch;
          });
          
          if (tempMessageIndex > -1) {
            // Replace the temporary message with the real one
            if (isLocal) {
              console.log('🔄 Replacing temp message at index:', tempMessageIndex);
            }
            ChatUtils.privateChatMessages[tempMessageIndex] = data;
          } else {
            // Add new message
            if (isLocal) {
              console.log('➕ Adding new message to chat');
            }
            ChatUtils.privateChatMessages.push(data);
          }
          
          setConversationId(data.conversationId || '');
          // Update messages with latest from ChatUtils - create new array to trigger React re-render
          const updatedMessages = [...ChatUtils.privateChatMessages];
          if (isLocal) {
            console.log('✅ Updating chat messages state, new count:', updatedMessages.length);
          }
          setChatMessages(updatedMessages);
        } else if (isLocal) {
          console.log('⚠️ Message already exists, skipping');
        }
      } else if (isLocal) {
        console.log('⚠️ Message not for current user, ignoring');
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

  static socketIOTyping(
    username: string,
    setTypingUsers: React.Dispatch<React.SetStateAction<string[]>>
  ): void {
    if (!username) {
      console.warn('⚠️ socketIOTyping called without username');
      return;
    }
    
    // Remove existing listener to prevent duplicates
    socketService?.socket?.off('typing');
    socketService?.socket?.off('stop typing');
    
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    if (isLocal) {
      console.log('🔧 Setting up typing listeners for username:', username);
    }
    
    socketService?.socket?.on('typing', (data: { senderName: string; receiverName: string }) => {
      const receiverName = (data.receiverName as string)?.toLowerCase() || '';
      const senderName = data.senderName || '';
      const currentUsername = username?.toLowerCase() || '';
      
      // Debug logging (only in local development)
      if (isLocal) {
        console.log('📝 Typing event received:', {
          senderName,
          receiverName,
          currentUsername,
          matches: receiverName === currentUsername,
          socketConnected: socketService?.socket?.connected
        });
      }
      
      // Check if this typing event is for the current user
      if (receiverName === currentUsername && senderName) {
        setTypingUsers((prevUsers: string[]) => {
          if (!prevUsers.includes(senderName)) {
            if (isLocal) {
              console.log('✅ Adding typing user:', senderName, 'Current list:', prevUsers);
            }
            return [...prevUsers, senderName];
          }
          return prevUsers;
        });
      } else if (isLocal) {
        console.log('⚠️ Typing event ignored - not for current user or missing senderName');
      }
    });

    socketService?.socket?.on('stop typing', (data: { senderName: string; receiverName: string }) => {
      const receiverName = (data.receiverName as string)?.toLowerCase() || '';
      const senderName = data.senderName || '';
      const currentUsername = username?.toLowerCase() || '';
      
      // Debug logging (only in local development)
      if (isLocal) {
        console.log('🛑 Stop typing event received:', {
          senderName,
          receiverName,
          currentUsername,
          matches: receiverName === currentUsername,
          socketConnected: socketService?.socket?.connected
        });
      }
      
      // Check if this stop typing event is for the current user
      if (receiverName === currentUsername && senderName) {
        setTypingUsers((prevUsers: string[]) => {
          const filtered = prevUsers.filter((user: string) => user !== senderName);
          if (isLocal) {
            console.log('✅ Removing typing user:', senderName, 'Updated list:', filtered);
          }
          return filtered;
        });
      } else if (isLocal) {
        console.log('⚠️ Stop typing event ignored - not for current user or missing senderName');
      }
    });
  }

  static emitTypingEvent(receiverName: string, senderName: string): void {
    socketService?.socket?.emit('typing', {
      receiverName,
      senderName
    });
  }

  static emitStopTypingEvent(receiverName: string, senderName: string): void {
    socketService?.socket?.emit('stop typing', {
      receiverName,
      senderName
    });
  }

  static socketIOMessageReaction(
    chatMessages: ChatUser[],
    username: string,
    setConversationId: (id: string) => void,
    setChatMessages: (messages: ChatUser[]) => void
  ): void {
    // Remove existing listener to prevent duplicates
    socketService?.socket?.off('message reaction');
    
    socketService?.socket?.on('message reaction', (data: ChatUser) => {
      if (
        (data.senderUsername as string)?.toLowerCase() === username?.toLowerCase() ||
        (data.receiverUsername as string)?.toLowerCase() === username?.toLowerCase()
      ) {
        setConversationId(data.conversationId || '');
        
        // Update ChatUtils.privateChatMessages (source of truth)
        const messageIndex = findIndex(ChatUtils.privateChatMessages, (message) => {
          const msgId = (message as ChatUser & { _id?: string })?._id;
          const dataId = (data as ChatUser & { _id?: string })?._id;
          return msgId === dataId;
        });
        
        if (messageIndex > -1) {
          // Update the message in ChatUtils
          ChatUtils.privateChatMessages[messageIndex] = data;
        } else {
          // If message not found, try to find and update in current chatMessages
          const currentMessageIndex = findIndex(chatMessages, (message) => {
            const msgId = (message as ChatUser & { _id?: string })?._id;
            const dataId = (data as ChatUser & { _id?: string })?._id;
            return msgId === dataId;
          });
          
          if (currentMessageIndex > -1) {
            // Update in ChatUtils if it exists there
            const utilsIndex = findIndex(ChatUtils.privateChatMessages, (message) => {
              const msgId = (message as ChatUser & { _id?: string })?._id;
              const dataId = (data as ChatUser & { _id?: string })?._id;
              return msgId === dataId;
            });
            
            if (utilsIndex > -1) {
              ChatUtils.privateChatMessages[utilsIndex] = data;
            } else {
              // Add to ChatUtils if not there
              ChatUtils.privateChatMessages.push(data);
            }
          }
        }
        
        // Update state with latest from ChatUtils
        const updatedChatMessages = [...ChatUtils.privateChatMessages];
        setChatMessages(updatedChatMessages);
      }
    });
  }
}

